'use client';

import type { Lens } from '@hookform/lenses';
import { Loader2, MapPin } from 'lucide-react';
import * as React from 'react';
import { useController } from 'react-hook-form';
import { z } from 'zod';
import { getPlaceDetails, getPlacesAutocomplete } from '@/actions/shuip/places';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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

export interface AddressFieldProps extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  lens: Lens<AddressData>;
  label?: string;
  placeholder?: string;
  description?: string;
  country?: string;
}

export function AddressField({
  lens,
  label = 'Address',
  placeholder = 'Enter your address',
  description,
  country = DEFAULT_COUNTRY,
  ...props
}: AddressFieldProps) {
  const fullAddress = useController(lens.focus('fullAddress').interop());
  const street = useController(lens.focus('street').interop());
  const city = useController(lens.focus('city').interop());
  const postalCode = useController(lens.focus('postalCode').interop());
  const countryField = useController(lens.focus('country').interop());
  const placeId = useController(lens.focus('placeId').interop());

  const [searchQuery, setSearchQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [isPending, startTransition] = React.useTransition();
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current;
      startTransition(async () => {
        try {
          const result = await getPlacesAutocomplete({
            input: searchQuery,
            components: country ? `country:${country}` : undefined,
            types: 'address',
            language: LANGUAGE_RESULT,
          });

          if (requestId !== requestIdRef.current) return;

          if (result.error) {
            throw new Error(result.error);
          }

          setSuggestions(result.predictions || []);
          setShowSuggestions(result.predictions?.length > 0);
          setSelectedIndex(-1);
        } catch (error) {
          if (requestId !== requestIdRef.current) return;
          console.error('Error searching addresses:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
    }, DEBOUNCE_TIME);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      requestIdRef.current++;
    };
  }, [searchQuery, country]);

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
    setSearchQuery('');

    startTransition(async () => {
      const details = await getPlaceDetails({
        placeId: suggestion.placeId,
        fields: ['address_components', 'formatted_address', 'geometry'],
        language: LANGUAGE_RESULT,
      });

      if (details?.result) {
        const addressComponents = details.result.address_components || [];

        let streetValue = '';
        let cityValue = '';
        let postalCodeValue = '';
        let countryValue = '';

        addressComponents.forEach((component: any) => {
          const types = component.types;

          if (types.includes('street_number')) {
            streetValue = `${component.long_name} ${streetValue}`;
          }
          if (types.includes('route')) {
            streetValue = `${streetValue} ${component.long_name}`;
          }
          if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            cityValue = component.long_name;
          }
          if (types.includes('postal_code')) {
            postalCodeValue = component.long_name;
          }
          if (types.includes('country')) {
            countryValue = component.long_name;
          }
        });

        street.field.onChange(streetValue.trim());
        city.field.onChange(cityValue.trim());
        postalCode.field.onChange(postalCodeValue.trim());
        countryField.field.onChange(countryValue.trim());
        fullAddress.field.onChange(details.result.formatted_address.trim());
        placeId.field.onChange(suggestion.placeId.trim());
      } else {
        fullAddress.field.onChange(suggestion.description.trim());
        placeId.field.onChange(suggestion.placeId.trim());
      }
    });
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
    if (suggestions.length > 0 && searchQuery.length >= 3) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (popoverRef.current?.contains(relatedTarget)) {
      return;
    }

    fullAddress.field.onBlur();

    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  const fullAddressInvalid = fullAddress.fieldState.invalid;
  const id = props.id ?? fullAddress.field.name;

  return (
    <Field className='gap-2' data-invalid={fullAddressInvalid}>
      <FieldLabel htmlFor={id} className='flex items-center justify-between'>
        {label}
        {fullAddressInvalid && (
          <FieldError className='max-sm:hidden text-xs opacity-80' errors={[fullAddress.fieldState.error]} />
        )}
      </FieldLabel>
      <div className='relative'>
        <Popover open={showSuggestions} onOpenChange={setShowSuggestions}>
          <PopoverTrigger asChild>
            <div className='relative'>
              <Input
                ref={inputRef}
                name={fullAddress.field.name}
                value={fullAddress.field.value ?? ''}
                placeholder={placeholder}
                autoComplete='off'
                {...props}
                id={id}
                onChange={(e) => {
                  const value = e.target.value;
                  fullAddress.field.onChange(value);
                  setSearchQuery(value);
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                aria-invalid={fullAddressInvalid}
              />
              <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                {isPending ? (
                  <Loader2 className='size-4 animate-spin text-muted-foreground' />
                ) : (
                  <MapPin className='size-4 text-muted-foreground' />
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent
            ref={popoverRef}
            className='p-0'
            align='start'
            onOpenAutoFocus={(e) => e.preventDefault()}
            style={{ width: 'var(--radix-popover-trigger-width)' }}
          >
            <Command className='w-full'>
              <CommandList className='max-h-60'>
                <CommandEmpty>{isPending ? 'Searching...' : 'No addresses found'}</CommandEmpty>
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
      {fullAddressInvalid && (
        <FieldError className='sm:hidden text-xs text-left opacity-80' errors={[fullAddress.fieldState.error]} />
      )}
    </Field>
  );
}
