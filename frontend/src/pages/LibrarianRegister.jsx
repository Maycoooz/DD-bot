import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/LibrarianRegister.css';

const COUNTRIES = [
  'Singapore','United States','United Kingdom','Australia','Canada',
  'China','India','Indonesia','Malaysia','Philippines','Vietnam','Thailand',
  'Japan','South Korea','Germany','France','Italy','Spain','Netherlands',
  'United Arab Emirates','Saudi Arabia','Brazil','Mexico','South Africa',
  'New Zealand','Other'
];

const RACES = [
  'Asian','African','European','Hispanic', 'American',
  'Middle Eastern','Pacific Islander','Mixed',
  'Prefer not to say','Other'
];

const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

const OTHER_VALUE = '__other__';

function RegisterLibrarian() {
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

    // handle selects with “Other”
    if (name === 'country') {
      setFormData(prev => ({
        ...prev,
        country: value,
        custom_country: value === OTHER_VALUE ? prev.custom_country : '',
      }));
      setError('');
      return;
    }
    if (name === 'race') {
      setFormData(prev => ({
        ...prev,
        race: value,
        custom_race: value === OTHER_VALUE ? prev.custom_race : '',
      }));
      setError('');
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirm_password) {
      return setError('Passwords do not match.');
    }

    // build payload
    const payload = { ...formData };
    delete payload.confirm_password;
    delete payload.custom_country;
    delete payload.custom_race;

    if (formData.country === OTHER_VALUE) {
      payload.country = formData.custom_country?.trim() || null;
    }
    if (formData.race === OTHER_VALUE) {
      payload.race = formData.custom_race?.trim() || null;
    }

    const optional = ['country', 'gender', 'race', 'birthday'];
    for (const k of optional) {
      if (!payload[k] || String(payload[k]).trim() === '') payload[k] = null;
    }

    try {
      const res = await api.post('/auth/register-librarian', payload);
      setSuccess(
        res.data?.message ||
          'Registration successful! Please verify your email and wait for admin approval.'
      );
    } catch (err) {
      let detail = 'Please input all fields correctly.';
      const d = err?.response?.data?.detail;
      if (typeof d === 'string') detail = d;
      setError(detail);
      console.error('Librarian register error:', err?.response || err);
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form register">
        <h2>Register Librarian Account</h2>

        {error && <p className="form-message error">{error}</p>}
        {success && <p className="form-message success">{success}</p>}

        {/* Row 1 */}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input id="username" name="username" value={formData.username} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="email">Librarian Email</label>
          <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        {/* Row 2 */}
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input 
            id="password" 
            type="password" 
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
            id="confirm_password"
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
            minLength={8}
          />
        </div>

        {/* Row 3 */}
        <div className="form-group">
          <label htmlFor="first_name">First Name</label>
          <input id="first_name" name="first_name" value={formData.first_name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label htmlFor="last_name">Last Name</label>
          <input id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} required />
        </div>

        {/* Row 4 */}
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
              type="text"
              name="custom_country"
              placeholder="Type your country"
              value={formData.custom_country}
              onChange={handleChange}
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
            <option value="">Select gender</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Row 5 */}
        <div className="form-group">
          <label htmlFor="birthday">Birthday (YYYY-MM-DD)</label>
          <input id="birthday" type="date" name="birthday" value={formData.birthday} onChange={handleChange} />
        </div>

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
              type="text"
              name="custom_race"
              placeholder="Type your race / ethnicity"
              value={formData.custom_race}
              onChange={handleChange}
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        {/* Full width row */}
        <button type="submit">Register</button>
        <p className="link-text">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterLibrarian;
