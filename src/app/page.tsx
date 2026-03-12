import LandingNavbar from './components/LandingNavbar';
import NewHeroSection from './components/NewHeroSection';
import StatsBar from './components/StatsBar';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import TestimonialsSection from './components/TestimonialsSection';
import LeadCaptureSectionNew from './components/LeadCaptureSectionNew';
import EnhancedFooter from './components/EnhancedFooter';

export default function LandingPage() {
  return (
    <main className="bg-slate-900 text-white overflow-x-hidden">
      <LandingNavbar />

      {/* Hero — has pt built-in via py-20, add top padding for fixed nav */}
      <div className="pt-16">
        <NewHeroSection />
      </div>

      <StatsBar />

      <div id="features">
        <FeaturesSection />
      </div>

      <div id="how-it-works">
        <HowItWorksSection />
      </div>

      <div id="testimonials">
        <TestimonialsSection />
      </div>

      <div id="lead-capture">
        <LeadCaptureSectionNew />
      </div>

      <EnhancedFooter />
    </main>
  );
}
