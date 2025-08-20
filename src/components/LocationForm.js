import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';
import '../styles/LocationForm.css'; // Updated path to src/styles/LocationForm.css
import _ from 'lodash';

const LocationForm = () => {
    const [formData, setFormData] = useState({
        country: '',
        state_or_region: '',
        city: '',
        region: '',
        street: '',
        latitude: 0,
        longitude: 0,
        created_at: new Date().toISOString()
    });

    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const countryOptions = Country.getAllCountries().map(country => ({
            value: country.isoCode,
            label: country.name
        }));
        setCountries(countryOptions);
    }, []);

    const handleCountryChange = (selectedOption) => {
        setFormData({ ...formData, country: selectedOption ? selectedOption.label : '', state_or_region: '', city: '' });
        setErrors({ ...errors, country: '' });

        if (selectedOption) {
            const stateOptions = State.getStatesOfCountry(selectedOption.value).map(state => ({
                value: state.isoCode,
                label: state.name
            }));
            setStates(stateOptions);
            setCities([]);
        } else {
            setStates([]);
            setCities([]);
        }
    };

    const handleStateChange = (selectedOption) => {
        setFormData({ ...formData, state_or_region: selectedOption ? selectedOption.label : '', city: '' });
        setErrors({ ...errors, state_or_region: '' });

        if (selectedOption) {
            const selectedCountry = countries.find(c => c.label === formData.country);
            const cityOptions = City.getCitiesOfState(selectedCountry.value, selectedOption.value).map(city => ({
                value: city.name,
                label: city.name
            }));
            setCities(cityOptions);
        } else {
            setCities([]);
        }
    };

    const handleCityChange = (selectedOption) => {
        setFormData({ ...formData, city: selectedOption ? selectedOption.label : '' });
        setErrors({ ...errors, city: '' });
    };

    const handleStreetChange = (street) => {
        setFormData({ ...formData, street });
        setErrors({ ...errors, street: '' });
    };

    const handleSelect = async (street) => {
        try {
            const results = await geocodeByAddress(street);
            const latLng = await getLatLng(results[0]);
            setFormData({
                ...formData,
                street,
                latitude: latLng.lat,
                longitude: latLng.lng
            });
            setErrors({ ...errors, street: '', latitude: '', longitude: '' });
        } catch (error) {
            console.error('Error selecting address:', error);
            setErrors({ ...errors, street: 'Error fetching coordinates for this address' });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.country) newErrors.country = 'Country is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (!formData.latitude || isNaN(formData.latitude)) newErrors.latitude = 'Valid latitude is required';
        if (!formData.longitude || isNaN(formData.longitude)) newErrors.longitude = 'Valid longitude is required';
        if (!formData.created_at) newErrors.created_at = 'Created at date is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        if (!validateForm()) {
            return;
        }

        try {
            const payload = {
                country: formData.country,
                state_or_region: formData.state_or_region || null,
                city: formData.city,
                region: formData.region || null,
                street: formData.street || null,
                latitude: formData.latitude,
                longitude: formData.longitude,
                created_at: formData.created_at
            };

            const response = await axios.post('https://localhost:14686/api/locations', payload);
            setSuccessMessage('Location added successfully!');
            setFormData({
                country: '',
                state_or_region: '',
                city: '',
                region: '',
                street: '',
                latitude: 0,
                longitude: 0,
                created_at: new Date().toISOString()
            });
            setStates([]);
            setCities([]);
        } catch (error) {
            console.error('Error submitting form:', error);
            setErrorMessage(error.response?.data?.error || 'Error adding location');
        }
    };

    return (
        <div className="location-form-container">
            <h2>Add Location</h2>
            {successMessage && <div className="success-message">{successMessage}</div>}
            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Country</label>
                    <Select
                        options={countries}
                        onChange={handleCountryChange}
                        value={countries.find(c => c.label === formData.country) || null}
                        placeholder="Select a country"
                        isClearable
                    />
                    {errors.country && <span className="error">{errors.country}</span>}
                </div>
                <div className="form-group">
                    <label>State/Region</label>
                    <Select
                        options={states}
                        onChange={handleStateChange}
                        value={states.find(s => s.label === formData.state_or_region) || null}
                        placeholder="Select a state/region"
                        isClearable
                        isDisabled={!states.length}
                    />
                    {errors.state_or_region && <span className="error">{errors.state_or_region}</span>}
                </div>
                <div className="form-group">
                    <label>City</label>
                    <Select
                        options={cities}
                        onChange={handleCityChange}
                        value={cities.find(c => c.label === formData.city) || null}
                        placeholder="Select a city"
                        isClearable
                        isDisabled={!cities.length}
                    />
                    {errors.city && <span className="error">{errors.city}</span>}
                </div>
                <div className="form-group">
                    <label>Region</label>
                    <input
                        type="text"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        placeholder="Enter region (optional)"
                    />
                    {errors.region && <span className="error">{errors.region}</span>}
                </div>
                <div className="form-group">
                    <label>Street</label>
                    <PlacesAutocomplete
                        value={formData.street}
                        onChange={handleStreetChange}
                        onSelect={handleSelect}
                    >
                        {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
                            <div>
                                <input
                                    {...getInputProps({
                                        placeholder: 'Enter street address',
                                        className: 'location-search-input'
                                    })}
                                />
                                <div className="autocomplete-dropdown-container">
                                    {loading && <div>Loading...</div>}
                                    {suggestions.map(suggestion => (
                                        <div {...getSuggestionItemProps(suggestion)} key={suggestion.placeId} className="suggestion-item">
                                            {suggestion.description}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </PlacesAutocomplete>
                    {errors.street && <span className="error">{errors.street}</span>}
                </div>
                <button type="submit">Submit</button>
            </form>
            <script src={`https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_API_KEY&libraries=places`}></script>
        </div>
    );
};

export default LocationForm;