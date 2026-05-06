'use server';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export interface AutocompleteParams {
  input: string;
  components?: string;
  types?: string;
  language?: string;
}

export async function getPlacesAutocomplete({ input, components, types, language = 'fr' }: AutocompleteParams) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    if (!input || input.length < 3) {
      return { predictions: [] };
    }

    // Construire l'URL de l'API Google Places Autocomplete
    const params = new URLSearchParams({
      input,
      key: GOOGLE_PLACES_API_KEY,
      language,
    });

    if (components) {
      params.append('components', components);
    }

    if (types) {
      params.append('types', types);
    }

    const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    // Transformer les données pour notre format
    const predictions =
      data.predictions?.map((prediction: any) => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting?.main_text || prediction.description,
        secondaryText: prediction.structured_formatting?.secondary_text || '',
        types: prediction.types || [],
      })) || [];

    return { predictions };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Internal server error', predictions: [] };
  }
}

export interface PlaceDetailsParams {
  placeId: string;
  fields?: string[];
  language?: string;
}

export async function getPlaceDetails({ placeId, fields, language = 'fr' }: PlaceDetailsParams) {
  try {
    if (!GOOGLE_PLACES_API_KEY) {
      throw new Error('Google Places API key not configured');
    }

    if (!placeId) {
      throw new Error('Place ID is required');
    }

    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_PLACES_API_KEY,
      language,
    });

    if (fields && Array.isArray(fields)) {
      params.append('fields', fields.join(','));
    }

    const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Internal server error' };
  }
}
