import { Navigate, Link } from 'react-router';
import { ArrowRight, BookOpen, Sparkles, Star, Users, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/loaders';
import wizzyImg from '@/assets/wizzy.png';
import logoImg from '@/assets/mathmagic-logo.png';

const steps = [
  {
    icon: <BookOpen size={24} aria-hidden="true" className="text-purple-wizzy" />,
    iconBg: 'bg-violet-100',
    title: '1. Choose a Topic',
    desc: 'Select from addition, subtraction, multiplication, division, and more math adventures.',
  },
  {
    icon: <Sparkles size={24} aria-hidden="true" className="text-purple-wizzy" />,
    iconBg: 'bg-violet-100',
    title: "2. Enter Wizzy's World",
    desc: 'Step into magical stories where Wizzy guides your child through enchanting learning experiences.',
  },
  {
    icon: <Star size={24} aria-hidden="true" className="text-gold-magic" />,
    iconBg: 'bg-amber-100',
    title: '3. Learn & Earn Stars',
    desc: 'Solve challenges, make choices, and earn achievements while mastering math skills.',
  },
];

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

      {/* What is MathMagic? */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">What is MathMagic?</h2>
          <div className="w-12 h-1 bg-purple-wizzy mx-auto mb-8 rounded-full" />
          <div className="bg-violet-50 rounded-2xl p-8 text-gray-700 leading-relaxed">
            MathMagic transforms math learning into an enchanting adventure using generative AI.
            Your child joins Wizzy on interactive journeys through magical worlds, where every math
            problem becomes part of an exciting story. Learning is personalized, playful, and
            designed to build confidence one adventure at a time.
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">How It Works</h2>
            <p className="text-gray-500">Three simple steps to start the magic</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.title}
                className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center gap-3"
              >
                <div className={`${step.iconBg} p-3 rounded-xl`}>{step.icon}</div>
                <h3 className="font-bold text-gray-800">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
