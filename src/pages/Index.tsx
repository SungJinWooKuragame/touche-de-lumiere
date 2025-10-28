import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Heart, Zap, Phone, Mail, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-spa.jpg";

export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*');
    if (data) {
      const settingsMap = data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
      setSettings(settingsMap);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
            element.classList.add('animate-fade-in-up');
          } else {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: false }));
            element.classList.remove('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1, rootMargin: '-10% 0px' }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const getHeroTitle = () => {
    const key = `hero_title_${i18n.language}`;
    return settings[key] || t('hero.title');
  };

  const getHeroSubtitle = () => {
    const key = `hero_subtitle_${i18n.language}`;
    return settings[key] || t('hero.subtitle');
  };

  const services = [
    {
      name: t('services.relaxingMassage'),
      description: t('services.relaxingDesc'),
      duration: `60 ${t('services.duration')}`,
      price: "€ 150,00",
      icon: Heart,
    },
    {
      name: t('services.therapeuticMassage'),
      description: t('services.therapeuticDesc'),
      duration: `60 ${t('services.duration')}`,
      price: "€ 180,00",
      icon: Zap,
    },
    {
      name: t('services.reiki'),
      description: t('services.reikiDesc'),
      duration: `45 ${t('services.duration')}`,
      price: "€ 120,00",
      icon: Sparkles,
    },
    {
      name: t('services.combo'),
      description: t('services.comboDesc'),
      duration: `90 ${t('services.duration')}`,
      price: "€ 250,00",
      icon: Heart,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Spa therapy environment" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            {getHeroTitle()}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            {getHeroSubtitle()}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <Button 
              variant="hero" 
              size="lg" 
              onClick={() => navigate("/agendar")}
              className="hover-scale"
            >
              {t('hero.bookSession')}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => document.getElementById('servicos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t('hero.knowServices')}
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicos" className="py-24 px-4" data-animate>
        <div className="container mx-auto max-w-6xl">
          <div className={`text-center mb-16 transition-all duration-1000 ${isVisible['servicos'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('services.title')}</h2>
            <p className="text-xl text-muted-foreground">
              {t('services.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card 
                  key={index} 
                  className={`shadow-soft hover:shadow-glow transition-all duration-500 hover:scale-[1.02] ${
                    isVisible['servicos'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                          <Icon className="w-6 h-6 text-primary" />
                          {service.name}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {service.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{service.duration}</span>
                      <span className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                        {service.price}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Prices Section */}
      <section id="precos" className="py-24 px-4 gradient-hero" data-animate>
        <div className={`container mx-auto max-w-4xl text-center transition-all duration-1000 ${
          isVisible['precos'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold mb-8">{t('prices.title')}</h2>
          <p className="text-xl text-muted-foreground mb-12">
            {t('prices.subtitle')}
          </p>
          <Button 
            variant="hero" 
            size="lg" 
            onClick={() => navigate("/agendar")}
            className="hover-scale"
          >
            {t('prices.startNow')}
          </Button>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-24 px-4" data-animate>
        <div className="container mx-auto max-w-4xl">
          <div className={`text-center mb-16 transition-all duration-1000 ${
            isVisible['contato'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">{t('contact.title')}</h2>
            <p className="text-xl text-muted-foreground">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className={`text-center shadow-soft hover:shadow-glow transition-all duration-500 hover:-translate-y-2 ${
              isVisible['contato'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Phone className="w-12 h-12 text-primary" />
                </div>
                <CardTitle>{t('contact.phone')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{settings.contact_phone || '+33 (0) 00 00 00 00'}</p>
              </CardContent>
            </Card>

            <Card className={`text-center shadow-soft hover:shadow-glow transition-all duration-500 hover:-translate-y-2 ${
              isVisible['contato'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: '100ms' }}>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <Mail className="w-12 h-12 text-primary" />
                </div>
                <CardTitle>{t('contact.email')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{settings.contact_email || 'contact@touchedelumiere.fr'}</p>
              </CardContent>
            </Card>

            <Card className={`text-center shadow-soft hover:shadow-glow transition-all duration-500 hover:-translate-y-2 ${
              isVisible['contato'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: '200ms' }}>
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <MapPin className="w-12 h-12 text-primary" />
                </div>
                <CardTitle>{t('contact.location')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {settings.contact_address || t('contact.homeService')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>{t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  );
}
