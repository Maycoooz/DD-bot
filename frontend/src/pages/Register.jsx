import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Register.css';

const COUNTRIES = [
  'Singapore','United States','United Kingdom','Australia','Canada',
  'China','India','Indonesia','Malaysia','Philippines','Vietnam','Thailand',
  'Japan','South Korea','Germany','France','Italy','Spain','Netherlands',
  'United Arab Emirates','Saudi Arabia','Brazil','Mexico','South Africa',
  'New Zealand','Other'
];

const RACES = [
  'Asian','Black / African','White / European','Hispanic / Latino',
  'Middle Eastern / North African','Pacific Islander','Mixed / Multiracial',
  'Prefer not to say','Other'
];

const OTHER_VALUE = '__other__';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
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
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Front-end basic required check
    const required = [
      'username',
      'email',
      'password',
      'confirm_password',
      'first_name',
      'last_name',
    ];
    const missing = required.filter((k) => !formData[k]?.trim());
    if (missing.length > 0) {
      setError('Please input all fields.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    // Build payload
    const dataToSend = { ...formData };
    delete dataToSend.confirm_password;
    delete dataToSend.custom_country;
    delete dataToSend.custom_race;

    // Resolve “Other” to custom typed values
    if (formData.country === OTHER_VALUE) {
      dataToSend.country = formData.custom_country?.trim() || null;
    }
    if (formData.race === OTHER_VALUE) {
      dataToSend.race = formData.custom_race?.trim() || null;
    }

    // Normalize optional fields
    const optionalFields = ['country', 'gender', 'race', 'birthday'];
    for (const key of optionalFields) {
      if (dataToSend[key] === '' || dataToSend[key] == null) {
        dataToSend[key] = null;
      }
    }

    try {
      const response = await api.post('/auth/register', dataToSend);
      setSuccess(response.data.message || 'Registration successful! Please verify your email.');
    } catch (err) {
      // Turn server validation arrays / 422 responses into the same friendly message
      const is422 = err.response?.status === 422;
      const detail = err.response?.data?.detail;

      if (is422 || Array.isArray(detail)) {
        setError('Please input all fields.');
        return;
      }

      if (typeof detail === 'string') {
        // If the backend sends a simple string for a different error, still show the friendly message
        setError('Please input all fields.');
        return;
      }

      // Fallback (e.g., network)
      setError('Please input all fields.');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form register">
        <h2>Register Parent Account</h2>

        {error && <p className="form-message error">{error}</p>}
        {success && <p className="form-message success">{success}</p>}

        {/* Credentials */}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" value={formData.username} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="confirm_password">Confirm Password</label>
          <input
            id="confirm_password"
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Personal */}
        <div className="form-group">
          <label htmlFor="first_name">First Name</label>
          <input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="last_name">Last Name</label>
          <input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
        </div>

        {/* Country (with Other) */}
        <div className="form-group">
          <label htmlFor="country">Country</label>
          <select id="country" name="country" value={formData.country} onChange={handleChange}>
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

        {/* Gender radios */}
        <div className="form-group">
          <label>Gender</label>
          <div className="gender-radio-group">
            <label className={`radio-button ${formData.gender === 'Male' ? 'selected' : ''}`}>
              <input type="radio" name="gender" value="Male" checked={formData.gender === 'Male'} onChange={handleChange} />
              Male
            </label>
            <label className={`radio-button ${formData.gender === 'Female' ? 'selected' : ''}`}>
              <input type="radio" name="gender" value="Female" checked={formData.gender === 'Female'} onChange={handleChange} />
              Female
            </label>
            <label className={`radio-button ${formData.gender === 'Other' ? 'selected' : ''}`}>
              <input type="radio" name="gender" value="Other" checked={formData.gender === 'Other'} onChange={handleChange} />
              Other
            </label>
            <label className={`radio-button ${formData.gender === 'Prefer not to say' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="gender"
                value="Prefer not to say"
                checked={formData.gender === 'Prefer not to say'}
                onChange={handleChange}
              />
              Prefer not to say
            </label>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="birthday">Birthday (YYYY-MM-DD)</label>
          <input id="birthday" type="date" name="birthday" value={formData.birthday} onChange={handleChange} />
        </div>

        {/* Race (with Other) */}
        <div className="form-group">
          <label htmlFor="race">Race / Ethnicity</label>
          <select id="race" name="race" value={formData.race} onChange={handleChange}>
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

        <button type="submit">Register</button>

        <p className="link-text">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
