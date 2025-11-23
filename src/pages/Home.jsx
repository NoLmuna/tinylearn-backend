// Home page with hero section, features and call-to-actions for students, parents and tutors
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AcademicCapIcon, UserGroupIcon, BookOpenIcon, SparklesIcon, PuzzlePieceIcon, ChartBarIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Hero from '../components/Hero';
import Card from '../components/ui/Card';
import homeImage from '../assets/home-based-learning-8968710_1280.png';

const features = [
  {
    title: 'Interactive Lessons',
    icon: SparklesIcon,
    bg: 'bg-gradient-to-br from-yellow-200 via-yellow-100 to-amber-50',
    iconBg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
    text: 'text-amber-900',
    iconColor: 'text-white',
    desc: 'Engaging, playful content for early learners with interactive activities.'
  },
  {
    title: 'Educational Games',
    icon: PuzzlePieceIcon,
    bg: 'bg-gradient-to-br from-pink-200 via-pink-100 to-rose-50',
    iconBg: 'bg-gradient-to-br from-pink-400 to-rose-500',
    text: 'text-rose-900', 
    iconColor: 'text-white',
    desc: 'Learn through play with fun activities and gamified lessons.'
  },
  {
    title: 'Progress Tracking',
    icon: ChartBarIcon,
    bg: 'bg-gradient-to-br from-blue-200 via-blue-100 to-sky-50',
    iconBg: 'bg-gradient-to-br from-blue-400 to-sky-500',
    text: 'text-blue-900',
    iconColor: 'text-white',
    desc: 'Visualize learning achievements and monitor growth easily.'
  },
  {
    title: 'Parent-Tutor Connect',
    icon: ChatBubbleLeftRightIcon,
    bg: 'bg-gradient-to-br from-green-200 via-green-100 to-emerald-50',
    iconBg: 'bg-gradient-to-br from-green-400 to-emerald-500',
    text: 'text-emerald-900',
    iconColor: 'text-white',
    desc: 'Stay updated and communicate with seamless messaging.'
  },
];

export default function Home() {
  const navigate = useNavigate();

  const heroButtons = [
    {
      label: 'Access Platform',
      variant: 'primary',
      size: 'lg',
      onClick: () => navigate('/login')
    }
  ];

  return (
    <div className="bg-gradient-to-b from-pink-50 via-yellow-50 to-blue-50 min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-yellow-200/30 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-pink-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/4 w-36 h-36 bg-blue-200/30 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-10 w-28 h-28 bg-green-200/30 rounded-full blur-xl"></div>
      </div>
      
      {/* Hero Section */}
      <Hero
        title="Where Little Minds Begin Big Journeys"
        subtitle="TinyLearn is an interactive learning platform connecting students, parents, and tutors with engaging educational experiences designed for young learners."
        image={homeImage}
        imageAlt="Home-based learning environment for young learners"
        buttons={heroButtons}
      />

      {/* What We Offer */}
      <section id="features" className="max-w-6xl mx-auto px-4 pb-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-heading font-extrabold text-primary mb-4 drop-shadow-sm">What We Offer</h2>
          <p className="text-xl text-gray-600 font-body max-w-2xl mx-auto leading-relaxed">
            Discover our comprehensive suite of tools designed to make learning fun and effective for everyone.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <Card
              key={feature.title}
              elevate={true}
              className={`${feature.bg} ${feature.text} border-white/50 shadow-xl relative overflow-hidden`}
            >
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              </div>
              
              <div className="relative flex items-start gap-6">
                <div className={`p-4 ${feature.iconBg} rounded-2xl shadow-lg transform hover:scale-105 transition-transform duration-200`}>
                  <feature.icon className={`h-8 w-8 ${feature.iconColor} drop-shadow-sm`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-heading font-bold mb-3 leading-tight drop-shadow-sm">
                    {feature.title}
                  </h3>
                  <p className="text-lg font-body font-medium opacity-90 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Access Information Section */}
      <section className="max-w-6xl mx-auto px-4 pb-20 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-heading font-extrabold text-primary mb-4 drop-shadow-sm">How to Get Access</h2>
          <p className="text-xl text-gray-600 font-body max-w-3xl mx-auto leading-relaxed">
            TinyLearn accounts are created and managed by school administrators. Contact your institution to receive your login credentials.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Card className="bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 border-blue-200 shadow-xl text-center p-8">
            <div className="mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl shadow-lg mx-auto w-fit">
                <AcademicCapIcon className="h-8 w-8 text-white drop-shadow-sm" />
              </div>
            </div>
            <h3 className="text-2xl font-heading font-bold mb-3 text-gray-800">Students</h3>
            <p className="text-lg font-body text-gray-600 leading-relaxed">
              Students receive their accounts from teachers or school administrators. Check with your teacher for your login details.
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-green-200 shadow-xl text-center p-8">
            <div className="mb-6">
              <div className="p-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl shadow-lg mx-auto w-fit">
                <UserGroupIcon className="h-8 w-8 text-white drop-shadow-sm" />
              </div>
            </div>
            <h3 className="text-2xl font-heading font-bold mb-3 text-gray-800">Parents</h3>
            <p className="text-lg font-body text-gray-600 leading-relaxed">
              Parent accounts are set up by school administrators. Contact your child's school to request access to track their progress.
            </p>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 border-purple-200 shadow-xl text-center p-8">
            <div className="mb-6">
              <div className="p-4 bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl shadow-lg mx-auto w-fit">
                <BookOpenIcon className="h-8 w-8 text-white drop-shadow-sm" />
              </div>
            </div>
            <h3 className="text-2xl font-heading font-bold mb-3 text-gray-800">Teachers</h3>
            <p className="text-lg font-body text-gray-600 leading-relaxed">
              Teacher accounts are created by school administrators. Contact your IT department or principal to set up your educator account.
            </p>
          </Card>
        </div>
      </section>

      {/* About & Contact Sections */}
      <section id="about" className="max-w-4xl mx-auto px-4 py-20 text-center relative z-10">
        <Card className="bg-white/90 backdrop-blur-sm border-white/60 shadow-xl">
          <h2 className="text-3xl font-heading font-bold text-primary mb-6 drop-shadow-sm">About TinyLearn</h2>
          <p className="text-lg font-body text-gray-700 leading-relaxed mb-6">
            TinyLearn is an interactive learning platform that connects students, parents, and tutors through engaging 
            educational experiences. In partnership with Level Up Learning Center, we provide positive and productive 
            educational environments that develop learning for students of all ages.
          </p>
          <p className="text-lg font-body text-gray-700 leading-relaxed">
            Our comprehensive platform includes interactive lessons, educational games, progress tracking, and seamless 
            communication between parents and tutors. We're committed to helping every student reach their full potential 
            through innovative teaching methods and personalized learning approaches.
          </p>
        </Card>
      </section>

      <section id="contact" className="max-w-4xl mx-auto px-4 pb-20 text-center relative z-10">
        <Card className="bg-gradient-to-br from-white via-blue-50/80 to-purple-50/80 backdrop-blur-sm border border-blue-200/60 shadow-2xl">
          <h2 className="text-3xl font-heading font-bold text-gray-800 mb-6 drop-shadow-sm">Contact Level Up Learning Center</h2>
          <p className="text-lg font-body text-gray-700 mb-8 leading-relaxed">
            Ready to get started with TinyLearn? Contact Level Up Learning Center today to learn more about our programs and how administrators can set up accounts for your educational institution!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-gray-800">Address</h3>
                  <p className="text-gray-600">Ground Floor #30 Canda St, Corner 18th St, East Bajac Bajac</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-gray-800">Phone</h3>
                  <p className="text-gray-600">(047) 222 5321</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-gray-800">Email</h3>
                  <p className="text-gray-600">lulc0214@gmail.com</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500 rounded-lg">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-gray-800">YouTube</h3>
                  <a 
                    href="https://youtube.com/@Level%20Up%20Learning%20Center" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-red-600 transition-colors"
                  >
                    Level Up Learning Center
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:lulc0214@gmail.com"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-700 text-gray-100 font-heading font-bold text-lg rounded-full shadow-xl button-lift transition-all duration-150 hover:from-blue-700 hover:to-purple-800 hover:shadow-2xl hover:text-white focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transform hover:scale-105 border-2 border-white/20"
            >
              📧 Email Us
            </a>
            <a
              href="tel:(047)222-5321"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-gray-100 font-heading font-bold text-lg rounded-full shadow-xl button-lift transition-all duration-150 hover:from-green-700 hover:to-emerald-800 hover:shadow-2xl hover:text-white focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-offset-2 transform hover:scale-105 border-2 border-white/20"
            >
              📞 Call Us
            </a>
          </div>
        </Card>
      </section>
    </div>
  );
}
