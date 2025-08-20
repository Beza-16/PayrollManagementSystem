import React, { useState, useEffect } from 'react';
import { useBranchSlice } from '../slices/BranchSlice';
import '../styles/BranchForm.css';
import axios from 'axios';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';

const BranchForm = ({ branch, onClose }) => {
  const { handleSubmit, isSubmitting, errorMessage, successMessage } = useBranchSlice();
  const [formData, setFormData] = useState({
    BranchName: '',
    CompanyID: '',
    PhoneNumber: '',
    Email: '',
  });
  const [locationData, setLocationData] = useState({
    country: '',
    state_or_region: '',
    city: '',
    street: '',
    latitude: 0,
    longitude: 0,
    created_at: new Date().toISOString(),
  });
  const [companies, setCompanies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [suggestions, setSuggestions] = useState([]);

  const isEditMode = !!branch && branch.BranchID;

  useEffect(() => {
    const countryOptions = Country.getAllCountries().map(country => ({
      value: country.isoCode,
      label: country.name,
    }));
    setCountries(countryOptions);

    const fetchCompanies = async () => {
      try {
        const response = await axios.get('https://localhost:14686/api/Company', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        setCompanies(response.data.map(company => ({
          value: company.CompanyID,
          label: company.CompanyName,
        })) || []);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
        setFormErrors(prev => ({ ...prev, companies: 'Failed to fetch companies' }));
      }
    };

    fetchCompanies();

    if (isEditMode && branch) {
      setFormData({
        BranchName: branch.BranchName || '',
        CompanyID: branch.CompanyID || '',
        PhoneNumber: branch.PhoneNumber || '',
        Email: branch.Email || '',
      });

      if (branch.LocationID) {
        const fetchLocation = async () => {
          try {
            const response = await axios.get(`https://localhost:14686/api/Location/${branch.LocationID}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
              },
            });
            const loc = response.data;
            setLocationData({
              country: loc.country || '',
              state_or_region: loc.state_or_region || '',
              city: loc.city || '',
              street: loc.street || '',
              latitude: loc.latitude || 0,
              longitude: loc.longitude || 0,
              created_at: loc.created_at || new Date().toISOString(),
            });

            const selectedCountry = countryOptions.find(c => c.label === loc.country);
            if (selectedCountry) {
              const stateOptions = State.getStatesOfCountry(selectedCountry.value).map(state => ({
                value: state.isoCode,
                label: state.name,
              }));
              setStates(stateOptions);

              if (loc.state_or_region) {
                const selectedState = stateOptions.find(s => s.label === loc.state_or_region);
                if (selectedState) {
                  const cityOptions = City.getCitiesOfState(selectedCountry.value, selectedState.value).map(city => ({
                    value: city.name,
                    label: city.name,
                  }));
                  setCities(cityOptions);
                }
              }
            }
          } catch (error) {
            console.error('Error fetching location details:', error);
            setFormErrors(prev => ({ ...prev, locationDetails: 'Failed to fetch location details' }));
          }
        };
        fetchLocation();
      }
    }
  }, [branch, isEditMode]);

  const handleCountryChange = (selectedOption) => {
    setLocationData(prev => ({
      ...prev,
      country: selectedOption ? selectedOption.label : '',
      state_or_region: '',
      city: '',
      latitude: 0,
      longitude: 0,
    }));
    setFormErrors(prev => ({ ...prev, country: '' }));

    if (selectedOption) {
      const stateOptions = State.getStatesOfCountry(selectedOption.value).map(state => ({
        value: state.isoCode,
        label: state.name,
      }));
      setStates(stateOptions);
      setCities([]);
    } else {
      setStates([]);
      setCities([]);
    }
  };

  const handleStateChange = (selectedOption) => {
    setLocationData(prev => ({
      ...prev,
      state_or_region: selectedOption ? selectedOption.label : '',
      city: '',
      latitude: 0,
      longitude: 0,
    }));
    setFormErrors(prev => ({ ...prev, state_or_region: '' }));

    if (selectedOption) {
      const selectedCountry = countries.find(c => c.label === locationData.country);
      if (selectedCountry) {
        const cityOptions = City.getCitiesOfState(selectedCountry.value, selectedOption.value).map(city => ({
          value: city.name,
          label: city.name,
        }));
        setCities(cityOptions);
      }
    } else {
      setCities([]);
    }
  };

  const handleCityChange = (selectedOption) => {
    setLocationData(prev => ({
      ...prev,
      city: selectedOption ? selectedOption.label : '',
      latitude: 0,
      longitude: 0,
    }));
    setFormErrors(prev => ({ ...prev, city: '' }));
  };

  const handleStreetChange = async (e) => {
    const value = e.target.value;
    setLocationData(prev => ({ ...prev, street: value }));
    setFormErrors(prev => ({ ...prev, street: '' }));

    if (value.length > 2) {
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: value,
            format: 'json',
            addressdetails: 1,
            limit: 5,
          },
        });
        setSuggestions(response.data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleStreetSelect = (suggestion) => {
    setLocationData(prev => ({
      ...prev,
      street: suggestion.display_name,
      latitude: suggestion.lat ? parseFloat(suggestion.lat) : 0,
      longitude: suggestion.lon ? parseFloat(suggestion.lon) : 0,
    }));
    setSuggestions([]);
    setFormErrors(prev => ({ ...prev, street: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleCompanyChange = (selectedOption) => {
    setFormData(prev => ({ ...prev, CompanyID: selectedOption ? selectedOption.value : '' }));
    setFormErrors(prev => ({ ...prev, CompanyID: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.BranchName) errors.BranchName = 'Branch Name is required';
    if (!formData.CompanyID) errors.CompanyID = 'Company is required';
    if (!locationData.country) errors.country = 'Country is required';
    if (!locationData.city) errors.city = 'City is required';
    if (!locationData.street) errors.street = 'Street Address is required';
    if (locationData.latitude < -90 || locationData.latitude > 90) {
      errors.latitude = 'Latitude must be between -90 and 90 degrees';
    }
    if (locationData.longitude < -180 || locationData.longitude > 180) {
      errors.longitude = 'Longitude must be between -180 and 180 degrees';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const locationPayload = {
        country: locationData.country,
        state_or_region: locationData.state_or_region || null,
        city: locationData.city,
        street: locationData.street,
        latitude: parseFloat(locationData.latitude),
        longitude: parseFloat(locationData.longitude),
        created_at: locationData.created_at,
      };

      const locationResponse = await axios.post('https://localhost:14686/api/Location', locationPayload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      const locationId = locationResponse.data.location_id;

      if (!locationId) {
        throw new Error('Failed to retrieve location ID');
      }

      const payload = {
        BranchName: formData.BranchName,
        CompanyID: formData.CompanyID,
        PhoneNumber: formData.PhoneNumber || null,
        Email: formData.Email || null,
        LocationID: locationId,
      };
      await handleSubmit(payload, isEditMode ? branch.BranchID : null);
      onClose();
    } catch (error) {
      console.error('Form submission error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMsg = error.response?.data?.error || error.message || 'Error submitting form';
      setFormErrors(prev => ({ ...prev, submit: `Failed to create location: ${errorMsg}` }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{isEditMode ? 'Edit Branch' : 'Add New Branch'}</h2>
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        {formErrors.submit && <div className="error-message">{formErrors.submit}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-columns">
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="CompanyID">Company</label>
                <Select
                  options={companies}
                  onChange={handleCompanyChange}
                  value={companies.find(c => c.value === formData.CompanyID) || null}
                  placeholder="Select a company"
                  isClearable
                />
                {formErrors.CompanyID && <span className="error">{formErrors.CompanyID}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="BranchName">Branch Name</label>
                <input
                  type="text"
                  id="BranchName"
                  name="BranchName"
                  value={formData.BranchName}
                  onChange={handleChange}
                  required
                />
                {formErrors.BranchName && <span className="error">{formErrors.BranchName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="PhoneNumber">Phone Number</label>
                <input
                  type="text"
                  id="PhoneNumber"
                  name="PhoneNumber"
                  value={formData.PhoneNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="Email">Email</label>
                <input
                  type="email"
                  id="Email"
                  name="Email"
                  value={formData.Email}
                  onChange={handleChange}
                />
              </div>
              <div className="location-details">
                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <Select
                    options={countries}
                    onChange={handleCountryChange}
                    value={countries.find(c => c.label === locationData.country) || null}
                    placeholder="Select a country"
                    isClearable
                  />
                  {formErrors.country && <span className="error">{formErrors.country}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="state_or_region">State/Region</label>
                  <Select
                    options={states}
                    onChange={handleStateChange}
                    value={states.find(s => s.label === locationData.state_or_region) || null}
                    placeholder="Select a state/region"
                    isClearable
                    isDisabled={!states.length}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <Select
                    options={cities}
                    onChange={handleCityChange}
                    value={cities.find(c => c.label === locationData.city) || null}
                    placeholder="Select a city"
                    isClearable
                    isDisabled={!cities.length}
                  />
                  {formErrors.city && <span className="error">{formErrors.city}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="street">Street Address</label>
                  <input
                    type="text"
                    id="street"
                    value={locationData.street}
                    onChange={handleStreetChange}
                    placeholder="Search for a street address..."
                  />
                  {suggestions.length > 0 && (
                    <ul className="suggestions">
                      {suggestions.map((suggestion) => (
                        <li key={suggestion.place_id} onClick={() => handleStreetSelect(suggestion)}>
                          {suggestion.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                  {formErrors.street && <span className="error">{formErrors.street}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="latitude">Latitude</label>
                  <input
                    type="number"
                    id="latitude"
                    value={locationData.latitude}
                    onChange={(e) => setLocationData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    step="0.000001"
                    min="-90"
                    max="90"
                    required
                  />
                  {formErrors.latitude && <span className="error">{formErrors.latitude}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="longitude">Longitude</label>
                  <input
                    type="number"
                    id="longitude"
                    value={locationData.longitude}
                    onChange={(e) => setLocationData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    step="0.000001"
                    min="-180"
                    max="180"
                    required
                  />
                  {formErrors.longitude && <span className="error">{formErrors.longitude}</span>}
                </div>
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting || isLoading}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting || isLoading}>
              {isEditMode ? 'Update' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BranchForm;