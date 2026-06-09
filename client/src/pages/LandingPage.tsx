import { Link } from 'react-router';
import { ArrowRight, BookOpen, Sparkles, Star, Users, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/loaders';
import wizzyImg from '@/assets/wizzy.png';
import logoImg from '@/assets/mathmagic-logo.png';

const steps = [
  {
    id: 'choose-topic',
    Icon: BookOpen,
    iconBg: 'bg-violet-100',
    iconClassName: 'text-purple-wizzy',
    title: '1. Choose a Topic',
    desc: 'Select from addition, subtraction, multiplication, division, and more math adventures.',
  },
  {
    id: 'wizzy-world',
    Icon: Sparkles,
    iconBg: 'bg-violet-100',
    iconClassName: 'text-purple-wizzy',
    title: "2. Enter Wizzy's World",
    desc: 'Step into magical stories where Wizzy guides your child through enchanting learning experiences.',
  },
  {
    id: 'earn-stars',
    Icon: Star,
    iconBg: 'bg-amber-100',
    iconClassName: 'text-gold-magic',
    title: '3. Learn & Earn Stars',
    desc: 'Solve challenges, make choices, and earn achievements while mastering math skills.',
  },
];

const parentFeatures = [
  "Create one account to manage all your children's profiles",
  'Track individual progress for each child',
  'View learning insights from your parent dashboard',
];

const childFeatures = [
  'Safe, ad-free learning environment',
  'Personalised adventures that adapt to their level',
  'Build confidence while having fun with Wizzy',
];

export default function LandingPage() {
  const { isLoading } = useAuth();

  if (isLoading) return <FullPageLoader />;

  return (
    <div className="min-h-screen bg-parchment">
      {/* Hero */}
      <section aria-label="Introduction" className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img src={logoImg} alt="MathMagic logo" className="h-30" />
          </Link>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <p className="text-gold-magic text-lg font-medium mb-2">Wizzy makes math easy!</p>
            <h1 className="text-4xl font-bold text-gray-800 leading-tight mb-6">
              Help your child discover the magic of mathematics through interactive stories and
              playful adventures that are tailored for them.
            </h1>
            <div className="flex gap-3">
              <Link
                to="/register"
                className="flex items-center gap-2 bg-purple-wizzy text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:bg-purple-wizzy/90 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                Get Started <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 border-2 border-purple-wizzy text-purple-wizzy px-6 py-3 rounded-xl font-semibold hover:bg-purple-wizzy/5 hover:shadow-sm hover:-translate-y-0.5 transition-all"
              >
                Log In
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div style={{ animation: 'mm-float 2.8s ease-in-out infinite' }}>
              <img src={wizzyImg} alt="Wizzy the wizard" className="w-64 md:w-72 aspect-square" />
            </div>
          </div>
        </div>
      </section>

      {/* What is MathMagic? */}
      <section aria-label="What is MathMagic" className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">What is MathMagic?</h2>
          <div className="w-12 h-1 bg-purple-wizzy mx-auto mb-8 rounded-full" />
          <div className="bg-violet-50 rounded-2xl p-8 text-gray-700 leading-relaxed">
            <p>
              MathMagic transforms math learning into an enchanting adventure using generative AI.
              Your child joins Wizzy on interactive journeys through magical worlds, where every
              math problem becomes part of an exciting story. Learning is personalized, playful, and
              designed to build confidence one adventure at a time.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section aria-label="How It Works" className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">How It Works</h2>
            <p className="text-gray-500">Three simple steps to start the magic</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.id}
                className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center text-center gap-3 hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className={`${step.iconBg} p-3 rounded-xl`}>
                  <step.Icon size={24} aria-hidden="true" className={step.iconClassName} />
                </div>
                <h3 className="font-bold text-gray-800">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safe, Personalized Learning */}
      <section aria-label="Safe, Personalized Learning" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Safe, Personalized Learning</h2>
            <div className="w-12 h-1 bg-purple-wizzy mx-auto rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-violet-50 rounded-2xl p-6 transition-all hover:shadow-sm hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-violet-100 p-2 rounded-xl">
                  <Users size={20} aria-hidden="true" className="text-purple-wizzy" />
                </div>
                <h3 className="font-bold text-gray-800">For Parents</h3>
              </div>
              <ul className="space-y-2">
                {parentFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle
                      size={16}
                      aria-hidden="true"
                      className="text-gold-magic mt-0.5 flex-shrink-0"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-violet-50 rounded-2xl p-6 transition-all hover:shadow-sm hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-violet-100 p-2 rounded-xl">
                  <Shield size={20} aria-hidden="true" className="text-purple-wizzy" />
                </div>
                <h3 className="font-bold text-gray-800">For Your Child</h3>
              </div>
              <ul className="space-y-2">
                {childFeatures.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle
                      size={16}
                      aria-hidden="true"
                      className="text-gold-magic mt-0.5 flex-shrink-0"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section
        aria-label="Call to action"
        className="relative bg-purple-wizzy py-16 px-6 text-center overflow-hidden"
      >
        <Star
          size={20}
          aria-hidden="true"
          className="absolute top-4 left-[6%] text-gold-magic"
          style={{ animation: 'mm-bg-twinkle 1.8s ease-in-out infinite', animationDelay: '0s' }}
        />
        <Star
          size={32}
          aria-hidden="true"
          className="absolute top-8 left-[18%] text-gold-magic"
          style={{ animation: 'mm-bg-twinkle 2.2s ease-in-out infinite', animationDelay: '0.3s' }}
        />
        <Star
          size={16}
          aria-hidden="true"
          className="absolute bottom-5 left-[12%] text-gold-magic"
          style={{ animation: 'mm-bg-twinkle 1.6s ease-in-out infinite', animationDelay: '0.7s' }}
        />
        <Star
          size={26}
          aria-hidden="true"
          className="absolute bottom-8 left-[30%] text-gold-magic"
          style={{ animation: 'mm-bg-twinkle 2.4s ease-in-out infinite', animationDelay: '0.2s' }}
        />
        <Star
          size={18}
          aria-hidden="true"
          className="absolute top-5 left-[42%] text-gold-magic"
          style={{ animation: 'mm-bg-twinkle 2.0s ease-in-out infinite', animationDelay: '1.0s' }}
        />
        <Star
          size={28}
          aria-hidden="true"
          className="absolute top-3 right-[8%] text-gold-magic"
          style={{ animation: 'mm-bg-twinkle 1.9s ease-in-out infinite', animationDelay: '0.5s' }}
        />
        <Star
          size={20}
          aria-hidden="true"
          className="absolute top-9 right-[22%] text-gold-magic"
          style={{ animation: 'mm-bg-twinkle 2.3s ease-in-out infinite', animationDelay: '0.9s' }}
        />
        <Star
          size={36}
          aria-hidden="true"
          className="absolute bottom-4 right-[14%] text-gold-magic"
          style={{ animation: 'mm-bg-twinkle 1.7s ease-in-out infinite', animationDelay: '0.4s' }}
        />
        <Star
          size={16}
          aria-hidden="true"
          className="absolute bottom-7 right-[33%] text-gold-magic"
          style={{ animation: 'mm-bg-twinkle 2.1s ease-in-out infinite', animationDelay: '1.2s' }}
        />
        <Star
          size={22}
          aria-hidden="true"
          className="absolute top-6 right-[40%] text-gold-magic"
          style={{ animation: 'mm-bg-twinkle 1.6s ease-in-out infinite', animationDelay: '0.8s' }}
        />
        <h2 className="text-2xl font-bold text-white mb-2">Ready to Start the Adventure?</h2>
        <p className="text-white/75 mb-8">Join thousands of families making math magical</p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-white text-purple-wizzy px-8 py-3 rounded-xl font-semibold shadow-sm hover:bg-violet-50 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          Get Started For Free <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-6 px-6 text-center">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} MathMagic. Making math magical, one adventure at a time.
        </p>
      </footer>
    </div>
  );
}
