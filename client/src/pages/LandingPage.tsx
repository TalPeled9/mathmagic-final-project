import { Navigate, Link } from 'react-router';
import { ArrowRight, BookOpen, Sparkles, Star, Users, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/loaders';
import wizzyImg from '@/assets/wizzy.png';
import logoImg from '@/assets/mathmagic-logo.png';

export default function LandingPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;
  if (user) return <Navigate to="/profiles" replace />;

  return (
    <div className="min-h-screen bg-parchment">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <img src={logoImg} alt="MathMagic logo" className="h-10 mb-8" />
          <p className="text-gold-magic text-sm font-medium mb-2">Wizzy makes math easy!</p>
          <h1 className="text-4xl font-bold text-gray-800 leading-tight mb-6">
            Help your child discover the magic of mathematics through interactive stories and
            playful adventures that are tailored for them.
          </h1>
          <div className="flex gap-3">
            <Link
              to="/register"
              className="flex items-center gap-2 bg-purple-wizzy text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-wizzy/90 transition-colors"
            >
              Get Started <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 border-2 border-purple-wizzy text-purple-wizzy px-6 py-3 rounded-xl font-semibold hover:bg-purple-wizzy/5 transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
        <div className="flex-shrink-0">
          <img src={wizzyImg} alt="Wizzy the wizard" className="w-64 md:w-72 aspect-square" />
        </div>
      </section>
    </div>
  );
}
