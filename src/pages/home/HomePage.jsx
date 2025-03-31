import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import CustomButton from '../../components/CustomButton';

const HomePage = () => {
  return (
    <Layout>
      <div className="relative bg-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gray-100 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">Discover the best</span>{' '}
                  <span className="block text-[#c5630c] xl:inline">tech products</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Explore a wide range of tech products from top brands and sellers. Find the perfect gadgets and accessories for your needs.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link to="/products">
                      <CustomButton type="primary" size="large">
                        Shop Now
                      </CustomButton>
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link to="/stores">
                      <CustomButton type="outline" size="large">
                        Explore Stores
                      </CustomButton>
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img 
            src="/images/hero-devices.png" 
            alt="Tech devices" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;