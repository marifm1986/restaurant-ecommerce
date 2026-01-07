'use client';

import Link from 'next/link';
import { Clock, Mail, Phone } from 'lucide-react';
import { Button, Card } from '@/components/ui';

export default function RegistrationPendingPage() {
  return (
    <Card variant="bordered" className="w-full max-w-md text-center">
      <div className="w-16 h-16 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
        <Clock className="w-8 h-8 text-orange-600" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Pending</h1>
      <p className="text-gray-600 mb-6">
        Thank you for registering! Your account is pending approval from the administrator.
      </p>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
        <h3 className="font-medium text-gray-900 mb-3">What happens next?</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs font-bold flex-shrink-0 mt-0.5">
              1
            </span>
            <span>Our team will review your registration</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs font-bold flex-shrink-0 mt-0.5">
              2
            </span>
            <span>You may be contacted to verify your business details</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs font-bold flex-shrink-0 mt-0.5">
              3
            </span>
            <span>Once approved, you'll receive a notification</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-xs font-bold flex-shrink-0 mt-0.5">
              4
            </span>
            <span>You can then log in and start ordering</span>
          </li>
        </ul>
      </div>

      <div className="border-t border-gray-100 pt-6 space-y-3">
        <p className="text-sm text-gray-500 mb-2">Need help or have questions?</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <a
            href="tel:+919876543210"
            className="inline-flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Phone className="h-4 w-4" />
            01756196928
          </a>
          <span className="hidden sm:inline text-gray-300">|</span>
          <a
            href="mailto:support@meatnbeans.co"
            className="inline-flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <Mail className="h-4 w-4" />
            support@meatnbeans.co
          </a>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <Link href="/">
          <Button variant="outline" className="w-full">
            Browse Products as Guest
          </Button>
        </Link>
      </div>
    </Card>
  );
}
