import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthForm.css';

// --- Dropdown data ---
const COUNTRIES = [
  'Singapore','United States','United Kingdom','Australia','Canada',
  'China','India','Indonesia','Malaysia','Philippines','Vietnam','Thailand',
  'Japan','South Korea','Germany','France','Italy','Spain','Netherlands',
  'United Arab Emirates','Saudi Arabia','Brazil','Mexico','South Africa',
  'New Zealand','Other'
];

const RACES = [
  'Asian','African','European','Hispanic','American',
  'Middle Eastern','Pacific Islander','Mixed',
  'Prefer not to say','Other'
];

const OTHER_VALUE = '__other__';

function CreateChild() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    country: '',
    custom_country: '',
    gender: '',
    birthday: '',      // YYYY-MM-DD
    race: '',
    custom_race: '',
    interests: [],
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [availableInterests, setAvailableInterests] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        const response = await api.get('/parent/interests');
        setAvailableInterests(response.data);
      } catch (err) {
        console.error('Failed to fetch interests: ', err);
        setError('Could not load the list of interests.');
      }
    };
    fetchInterests();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Country & Race use sentinel for "Other"
    if (name === 'country') {
      setFormData((prev) => ({
        ...prev,
        country: value,
        custom_country: value === OTHER_VALUE ? prev.custom_country : '',
      }));
      setError('');
      return;
    }
    if (name === 'race') {
      setFormData((prev) => ({
        ...prev,
        race: value,
        custom_race: value === OTHER_VALUE ? prev.custom_race : '',
      }));
      setError('');
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleCheckboxChange = (interestName) => {
    setFormData((prevFormData) => {
      const current = prevFormData.interests;
      if (current.includes(interestName)) {
        return { ...prevFormData, interests: current.filter((i) => i !== interestName) };
      }
      return { ...prevFormData, interests: [...current, interestName] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validations
    if (formData.password !== formData.confirm_password) {
      return setError('Passwords do not match.');
    }
    if (formData.password.length < 8) {
      return setError('Password must be at least 8 characters long.');
    }
    if (formData.interests.length < 3) {
      return setError('Please select at least 3 interests.');
    }

    // Prepare payload
    const dataToSend = { ...formData };

    // Resolve “Other” values
    if (formData.country === OTHER_VALUE) {
      dataToSend.country = formData.custom_country?.trim() || null;
    }
    if (formData.race === OTHER_VALUE) {
      dataToSend.race = formData.custom_race?.trim() || null;
    }

    // Normalize optional fields
    const optionalFields = ['country', 'gender', 'race', 'birthday'];
    for (const key of optionalFields) {
      if (dataToSend[key] === '') dataToSend[key] = null;
    }

    try {
      await api.post('/parent/create-child', dataToSend);
      setSuccess(`Child account '${dataToSend.username}' created successfully!`);

      // Reset form
      setFormData({
        username: '',
        password: '',
        confirm_password: '',
        first_name: '',
        last_name: '',
        country: '',
        custom_country: '',
        gender: '',
        birthday: '',
        race: '',
        custom_race: '',
        interests: [],
      });
    } catch (err) {
      console.error('Child Creation Error Response:', err.response);
      const defaultDetail = 'Account creation failed. Check input values.';
      let detail = defaultDetail;

      if (err.response?.data?.detail) {
        const d = err.response.data.detail;
        if (Array.isArray(d)) {
          detail =
            'Validation Failed: ' +
            d
              .map((e) => `${e.loc?.[e.loc.length - 1] || 'field'} (${e.msg})`)
              .join('; ');
        } else {
          detail = d;
        }
      } else if (err.message) {
        detail = `Network Error: ${err.message}`;
      }

      setError(detail);
    }
  };

  return (
    <div className="main-content-card">
      <h2>Create Child Account</h2>
      <p>Create your childs account here! Please choose at least 3 interests!</p>

      {/* Use the same two-column grid layout as register */}
      <form onSubmit={handleSubmit} className="auth-form register">
        {error && <p className="form-message error">{error}</p>}
        {success && <p className="form-message success">{success}</p>}

        {/* Credentials */}
        <div className="form-group">
          <label htmlFor="username">Username (Child)</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirm_password">Confirm Password</label>
          <input
            type="password"
            id="confirm_password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
            minLength={8}
          />
        </div>

        {/* Personal */}
        <div className="form-group">
          <label htmlFor="first_name">First Name</label>
          <input
            type="text"
            id="first_name"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="last_name">Last Name</label>
          <input
            type="text"
            id="last_name"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Country (dropdown + Other) */}
        <div className="form-group">
          <label htmlFor="country">Country</label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c === 'Other' ? OTHER_VALUE : c}>
                {c}
              </option>
            ))}
          </select>
          {formData.country === OTHER_VALUE && (
            <input
              className="other-input"
              type="text"
              name="custom_country"
              placeholder="Type your country"
              value={formData.custom_country}
              onChange={handleChange}
            />
          )}
        </div>

        {/* Gender (dropdown) */}
        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>

        {/* Birthday */}
        <div className="form-group">
          <label htmlFor="birthday">Birthday (YYYY-MM-DD)</label>
          <input
            type="date"
            id="birthday"
            name="birthday"
            value={formData.birthday}
            onChange={handleChange}
          />
        </div>

        {/* Race (dropdown + Other) */}
        <div className="form-group">
          <label htmlFor="race">Race / Ethnicity</label>
          <select
            id="race"
            name="race"
            value={formData.race}
            onChange={handleChange}
          >
            <option value="">Select race / ethnicity</option>
            {RACES.map((r) => (
              <option key={r} value={r === 'Other' ? OTHER_VALUE : r}>
                {r}
              </option>
            ))}
          </select>
          {formData.race === OTHER_VALUE && (
            <input
              className="other-input"
              type="text"
              name="custom_race"
              placeholder="Type your race / ethnicity"
              value={formData.custom_race}
              onChange={handleChange}
            />
          )}
        </div>

        {/* Interests */}
        <div className="form-group full-width">
          <label>Child's Interests (select at least 3)</label>
          <div className="custom-dropdown">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="dropdown-button"
            >
              {formData.interests.length > 0
                ? `${formData.interests.length} selected`
                : 'Select interests...'}
              <span className="dropdown-arrow">
                {isDropdownOpen ? '▲' : '▼'}
              </span>
            </button>

            {isDropdownOpen && (
              <div className="dropdown-panel">
                {availableInterests.map((interest) => (
                  <label key={interest.name} className="dropdown-item">
                    <input
                      type="checkbox"
                      value={interest.name}
                      checked={formData.interests.includes(interest.name)}
                      onChange={() => handleCheckboxChange(interest.name)}
                    />
                    {interest.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit">Create Account</button>
      </form>
    </div>
  );
}

export default CreateChild;
