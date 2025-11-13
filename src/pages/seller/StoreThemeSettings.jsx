import React, { useState, useEffect } from 'react';
import { getPopularGoogleFonts } from '../../utils/fontLoader';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const StoreThemeSettings = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    primary_color: '#3498db',
    secondary_color: '#2ecc71',
    font: 'Roboto',
    logo_url: null,
    banner_url: null,
  });
  const [availableFonts] = useState(getPopularGoogleFonts());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchTheme = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/stores/${currentUser.store.subdomain_name}/theme/`);
        setFormData(response.data);
      } catch (err) {
        setError('Failed to load theme settings');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && currentUser.store) {
      fetchTheme();
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    try {
      await api.put(`/stores/${currentUser.store.subdomain_name}/theme/`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Theme settings updated successfully');
    } catch (err) {
      setError('Failed to update theme settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Store Theme Settings</h2>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Primary Color</label>
          <input
            type="color"
            name="primary_color"
            value={formData.primary_color}
            onChange={handleChange}
            className="w-full h-10 p-1 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Secondary Color</label>
          <input
            type="color"
            name="secondary_color"
            value={formData.secondary_color}
            onChange={handleChange}
            className="w-full h-10 p-1 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Store Font</label>
          <select
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            name="font"
            value={formData.font || 'Roboto'}
            onChange={handleChange}
          >
            {availableFonts.map((font) => (
              <option key={font.name} value={font.name} style={{ fontFamily: `'${font.name}', sans-serif` }}>
                {font.displayName}
              </option>
            ))}
          </select>
          <p className="text-gray-600 text-xs mt-1">This font will be used throughout your store</p>
          <div className="mt-2 p-3 border rounded" style={{ fontFamily: `'${formData.font || 'Roboto'}', sans-serif` }}>
            <p className="font-bold">This is how your selected font looks</p>
            <p>The quick brown fox jumps over the lazy dog</p>
            <p className="text-xs">Small text example</p>
            <p className="text-2xl">Large text example</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Logo</label>
          <input type="file" name="logo_url" onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Banner</label>
          <input type="file" name="banner_url" onChange={handleChange} className="w-full p-2 border rounded" />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#c5630c] text-white px-6 py-3 rounded-lg hover:bg-[#b35500] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreThemeSettings;