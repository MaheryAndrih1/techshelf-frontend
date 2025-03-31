import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import CustomButton from '../../components/CustomButton';

const AddProductPage = () => {
  const { isAuthenticated, isSeller } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: ''
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories] = useState([
    'Laptops', 'Phones', 'Tablets', 'Desktop PCs', 'Accessories', 
    'Monitors', 'Storage', 'Networking', 'Components', 'Software', 'Gaming console'
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/seller/add-product' } });
      return;
    }

    if (!isSeller) {
      navigate('/become-seller');
      return;
    }
  }, [isAuthenticated, isSeller, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(file);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.name) {
      setError('Product name is required');
      setLoading(false);
      return;
    }

    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      setError('Valid price is required');
      setLoading(false);
      return;
    }

    if (!formData.stock || isNaN(formData.stock) || parseInt(formData.stock) < 0) {
      setError('Valid stock quantity is required');
      setLoading(false);
      return;
    }

    try {
      const productFormData = new FormData();
      productFormData.append('name', formData.name);
      productFormData.append('price', formData.price);
      productFormData.append('stock', formData.stock);
      productFormData.append('category', formData.category);
      productFormData.append('description', formData.description);

      if (image) {
        productFormData.append('image', image);
      }

      await api.post('/products/create/', productFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Product added successfully!');

      setFormData({
        name: '',
        price: '',
        stock: '',
        category: '',
        description: ''
      });
      setImage(null);
      setImagePreview('');

      setTimeout(() => {
        navigate('/seller/dashboard');
      }, 1500);
    } catch (err) {
      const message = err.response?.data?.error || err.response?.data?.detail || 'Failed to create product';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Add New Product</h1>

        <div className="bg-white p-6 rounded-lg shadow-md">
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block mb-1 text-sm font-medium text-gray-700">
                  Product Name*
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block mb-1 text-sm font-medium text-gray-700">
                  Category*
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="price" className="block mb-1 text-sm font-medium text-gray-700">
                  Price ($)*
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              <div>
                <label htmlFor="stock" className="block mb-1 text-sm font-medium text-gray-700">
                  Stock Quantity*
                </label>
                <input
                  type="number"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="0"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block mb-1 text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                ></textarea>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="image" className="block mb-1 text-sm font-medium text-gray-700">
                  Product Image
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  accept="image/*"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Product Preview"
                      className="h-40 object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate('/seller/dashboard')}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <CustomButton
                type="submit"
                disabled={loading}
                className="px-6 py-2"
              >
                {loading ? 'Adding Product...' : 'Add Product'}
              </CustomButton>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default AddProductPage;
