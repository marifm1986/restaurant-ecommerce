'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin } from 'lucide-react';
import { APP_CONFIG } from '@/config/features';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-semibold text-white">{APP_CONFIG.APP_NAME}</span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Premium quality meat and beans for restaurants. Fresh, reliable, and delivered on time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm hover:text-orange-500 transition-colors">
                  Browse Products
                </Link>
              </li>
              <li>
                <Link href="/orders/track" className="text-sm hover:text-orange-500 transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm hover:text-orange-500 transition-colors">
                  Login / Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-orange-500" />
                <span>01756196928</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-orange-500" />
                <span>orders@meatnbeans.co</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-orange-500 mt-0.5" />
                <span>123 Food Market Road,<br />Mumbai, Maharashtra 400001</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} {APP_CONFIG.APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
