import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Brain, BookOpen, Heart, Code, TrendingUp, Sparkles, Zap, Users, Target, GraduationCap } from "lucide-react";
const Index = () => {
  const features = [{
    icon: Brain,
    title: "AI Tutor Chat",
    description: "Your personal learning assistant powered by advanced AI. Get instant help with any subject, anytime.",
    color: "primary",
    href: "/tutor"
  }, {
    icon: BookOpen,
    title: "AR-Teach 360",
    description: "Visualize complex concepts in 3D augmented reality. Make difficult topics come alive and easy to understand.",
    color: "info",
    href: "/ar-learning"
  }, {
    icon: Heart,
    title: "MindPulse",
    description: "Monitor your focus and emotional well-being while studying. Stay engaged and maintain healthy study habits.",
    color: "success",
    href: "/mindpulse"
  }, {
    icon: Code,
    title: "Talk2Code",
    description: "Learn programming through conversation. Speak your ideas and watch them transform into working code.",
    color: "accent",
    href: "/talk2code"
  }, {
    icon: TrendingUp,
    title: "LearnFlow",
    description: "Adaptive learning paths tailored to your progress. AI-powered recommendations for optimal learning journey.",
    color: "primary",
    href: "/learnflow"
  }, {
    icon: GraduationCap,
    title: "Adaptive Chapter Learning",
    description: "Personalized self-paced learning with diagnostic onboarding, adaptive explanations, and faculty insights.",
    color: "accent",
    href: "/adaptive-learning"
  }];
  const stats = [{
    icon: Users,
    value: "10K+",
    label: "Active Learners"
  }, {
    icon: Target,
    value: "95%",
    label: "Success Rate"
  }, {
    icon: Zap,
    value: "24/7",
    label: "AI Support"
  }];
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary animate-float">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Welcome to the Future of Learning</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Transform Your{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500">
                Learning Journey
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              EduVerse combines AI tutoring, AR visualization, emotional intelligence, 
              and adaptive learning to create a personalized education experience that evolves with you.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              
              
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12">
              {stats.map((stat, index) => <div key={index} className="space-y-2">
                  <div className="flex justify-center">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-bold text-center md:text-6xl">
              Six Powerful{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500">
                Learning Modules
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-2xl">
              Each module works seamlessly together to create a complete learning ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => <Link key={index} to={feature.href}>
                <Card className="p-6 h-full hover:shadow-elevation transition-all duration-300 hover:-translate-y-1 cursor-pointer border-2 hover:border-primary/20 group border-solid rounded-3xl opacity-100">
                  <div className={`inline-flex p-3 rounded-xl bg-${feature.color}/10 mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-6 w-6 text-${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </Link>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join thousands of students already learning smarter with EduVerse
            </p>
            <Button size="lg" className="gradient-primary text-primary-foreground shadow-primary hover:opacity-90 h-12 px-8 text-base rounded-full" asChild>
              <Link to="/select-role">Get Started Now</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center gradient-primary rounded-full">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">EduVerse</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 EduVerse. Transforming education through AI.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;