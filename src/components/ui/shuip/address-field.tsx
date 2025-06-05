'use client';

import { getPlaceDetails, getPlacesAutocomplete } from '@/actions/shuip/places';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Loader2, MapPin } from 'lucide-react';
import * as React from 'react';
import { type FieldPath, type FieldValues, type UseFormRegisterReturn, useFormContext } from 'react-hook-form';
import { z } from 'zod';

const DEFAULT_COUNTRY = 'US';
const LANGUAGE_RESULT = 'en';
const DEBOUNCE_TIME = 300;

export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  fullAddress: z.string().min(1, 'Address is required'),
  placeId: z.string().optional(),
});

export type AddressData = z.infer<typeof addressSchema>;

interface AddressSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

interface AddressFieldProps extends React.ComponentProps<typeof Input> {
  register: UseFormRegisterReturn<FieldPath<FieldValues>>;
  label?: string;
  placeholder?: string;
  description?: string;
  country?: string;
}

export function AddressField({
  register,
  label = 'Address',
  placeholder = 'Enter your address',
  description,
  country = DEFAULT_COUNTRY,
  ...props
}: AddressFieldProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);
  const form = useFormContext();

  const searchAddresses = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const result = await getPlacesAutocomplete({
        input: query,
        components: country ? `country:${country}` : undefined,
        types: 'address',
        language: LANGUAGE_RESULT,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      setSuggestions(result.predictions || []);
      setShowSuggestions(result.predictions?.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (inputValue.length >= 3) {
      debounceTimerRef.current = setTimeout(() => {
        searchAddresses(inputValue);
      }, DEBOUNCE_TIME);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue]);

  const handleSelectAddress = async (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    setSelectedIndex(-1);

    const details = await getPlaceDetails({
      placeId: suggestion.placeId,
      fields: ['address_components', 'formatted_address', 'geometry'],
      language: LANGUAGE_RESULT,
    });

    if (details?.result) {
      const addressComponents = details.result.address_components || [];

      let street = '';
      let city = '';
      let postalCode = '';
      let country = '';

      addressComponents.forEach((component: any) => {
        const types = component.types;

        if (types.includes('street_number')) {
          street = `${component.long_name} ${street}`;
        }
        if (types.includes('route')) {
          street = `${street} ${component.long_name}`;
        }
        if (types.includes('locality') || types.includes('administrative_area_level_2')) {
          city = component.long_name;
        }
        if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
        if (types.includes('country')) {
          country = component.long_name;
        }
      });

      form.setValue(`${register.name}.street`, street.trim());
      form.setValue(`${register.name}.city`, city.trim());
      form.setValue(`${register.name}.postalCode`, postalCode.trim());
      form.setValue(`${register.name}.country`, country.trim());
      form.setValue(`${register.name}.fullAddress`, details.result.formatted_address.trim());
      form.setValue(`${register.name}.placeId`, suggestion.placeId.trim());
    } else {
      form.setValue(`${register.name}.fullAddress`, suggestion.description.trim());
      form.setValue(`${register.name}.placeId`, suggestion.placeId.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectAddress(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    if (suggestions.length > 0 && inputValue.length >= 3) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (popoverRef.current?.contains(relatedTarget)) {
      return;
    }

    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  return (
    <FormField
      {...register}
      name={`${register.name}.fullAddress`}
      render={({ field }) => (
        <FormItem>
          <FormLabel className='flex items-center justify-between'>
            {label}
            <FormMessage className='max-sm:hidden text-xs opacity-80' />
          </FormLabel>
          <div className='relative'>
            <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
              <PopoverTrigger asChild>
                <FormControl>
                  <div className='relative'>
                    <Input
                      ref={inputRef}
                      value={inputValue}
                      placeholder={placeholder}
                      onChange={(e) => {
                        const value = e.target.value;
                        setInputValue(value);
                        field.onChange(value);
                      }}
                      onFocus={handleFocus}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      autoComplete='off'
                      {...props}
                    />
                    <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                      {loading ? (
                        <Loader2 className='size-4 animate-spin text-muted-foreground' />
                      ) : (
                        <MapPin className='size-4 text-muted-foreground' />
                      )}
                    </div>
                  </div>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                ref={popoverRef}
                className='p-0'
                align='start'
                onOpenAutoFocus={(e) => e.preventDefault()}
                style={{ width: inputRef.current?.offsetWidth }}
              >
                <Command className='w-full'>
                  <CommandList className='max-h-60'>
                    <CommandEmpty>{loading ? 'Searching...' : 'No addresses found'}</CommandEmpty>
                    <CommandGroup>
                      {suggestions.map((suggestion, index) => (
                        <CommandItem
                          key={suggestion.placeId}
                          value={suggestion.description}
                          onSelect={() => handleSelectAddress(suggestion)}
                          className={cn(
                            'flex items-start space-x-2 p-3 cursor-pointer',
                            selectedIndex === index && 'bg-accent',
                          )}
                        >
                          <MapPin className='size-4 mt-0.5 text-muted-foreground flex-shrink-0' />
                          <div className='flex-1 min-w-0'>
                            <div className='font-medium text-sm'>{suggestion.mainText}</div>
                            <div className='text-xs text-muted-foreground truncate'>{suggestion.secondaryText}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {description && <p className='text-sm text-muted-foreground'>{description}</p>}
          <FormMessage className='sm:hidden text-xs text-left opacity-80' />
        </FormItem>
      )}
    />
  );
}
