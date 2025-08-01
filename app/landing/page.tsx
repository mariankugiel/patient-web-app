"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import {
  Shield,
  Heart,
  Users,
  Lock,
  FileText,
  Smartphone,
  UserPlus,
  Share2,
  Sparkles,
  Eye,
  Globe,
  Zap,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [language, setLanguage] = useState<"en" | "pt">("en")

  const translations = {
    en: {
      tagline: "Your Health, One Place",
      subtitle:
        "Centralize all your health and wellness data, connect with healthcare professionals, and take control of your healthcare journey.",
      login: "Login",
      createAccount: "Create Account",
      features: "Key Features",
      steps: "3 Easy Steps to Start",
      security: "Security & Privacy",
      mission: "Our Mission",
      values: "Our Values",
      contact: "Contact Us",
    },
    pt: {
      tagline: "A Sua Saúde, Num Lugar",
      subtitle:
        "Centralize todos os seus dados de saúde e bem-estar, conecte-se com profissionais de saúde e tome controlo da sua jornada de cuidados de saúde.",
      login: "Entrar",
      createAccount: "Criar Conta",
      features: "Funcionalidades Principais",
      steps: "3 Passos Simples para Começar",
      security: "Segurança e Privacidade",
      mission: "A Nossa Missão",
      values: "Os Nossos Valores",
      contact: "Contacte-nos",
    },
  }

  const t = translations[language]

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-teal-100"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-teal-600 transition-colors">
              {t.features}
            </a>
            <a href="#values" className="text-gray-600 hover:text-teal-600 transition-colors">
              {t.values}
            </a>
            <a href="#contact" className="text-gray-600 hover:text-teal-600 transition-colors">
              {t.contact}
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLanguage(language === "en" ? "pt" : "en")}
              className="text-gray-600"
            >
              {language === "en" ? "PT" : "EN"}
            </Button>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => setLoginOpen(true)} className="text-teal-600 hover:text-teal-700">
              {t.login}
            </Button>
            <Button onClick={() => setSignupOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white">
              {t.createAccount}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6">
              <span className="text-teal-600">{language === "en" ? "Your Health" : "A Sua Saúde"}</span>
              <span className="text-gray-900">{language === "en" ? ", One Place" : ", Num Lugar"}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">{t.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => setSignupOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 text-lg"
              >
                {t.createAccount}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLoginOpen(true)}
                className="border-teal-600 text-teal-600 hover:bg-teal-50 px-8 py-4 text-lg"
              >
                {t.login}
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/hero-woman-phone.jpg"
                alt="Woman using health app"
                width={600}
                height={400}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-teal-600/20 to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.features}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive health management tools designed to put you in control
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Heart,
                title: "Health Records",
                description: "Centralize all your medical records, lab results, and health data in one secure place",
              },
              {
                icon: Users,
                title: "Doctor Connection",
                description: "Connect directly with healthcare professionals and manage appointments seamlessly",
              },
              {
                icon: Smartphone,
                title: "Wearable Integration",
                description: "Sync data from your fitness trackers and health devices automatically",
              },
              {
                icon: FileText,
                title: "Health Analytics",
                description: "Get insights and trends from your health data with intelligent analytics",
              },
              {
                icon: Shield,
                title: "Secure & Private",
                description: "Your data is protected with enterprise-grade security and encryption",
              },
              {
                icon: Globe,
                title: "Accessible Anywhere",
                description: "Access your health information anytime, anywhere, from any device",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6">
                    <feature.icon className="w-12 h-12 text-teal-600 mb-4" />
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Steps Section */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.steps}</h2>
            <p className="text-xl text-gray-600">Simple steps to transform your healthcare experience</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: UserPlus,
                title: "Create Account",
                description: "Sign up in minutes and set up your secure health profile",
              },
              {
                step: "2",
                icon: Share2,
                title: "Share Data",
                description: "Connect wearables and upload blood analysis or medical reports",
              },
              {
                step: "3",
                icon: Sparkles,
                title: "Enjoy",
                description: "Take control of your health journey with personalized insights",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                    <span className="text-teal-600 font-bold">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-600 text-lg">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.security}</h2>
            <p className="text-xl text-gray-600">Your health data deserves the highest level of protection</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "HIPAA Compliance",
                description: "Fully compliant with healthcare data protection standards",
              },
              {
                icon: Globe,
                title: "GDPR Compliance",
                description: "European data protection regulations fully implemented",
              },
              {
                icon: Lock,
                title: "End-to-End Encryption",
                description: "Your data is encrypted at rest and in transit",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <item.icon className="w-16 h-16 text-teal-600 mx-auto mb-6" />
                <h3 className="text-xl font-semibold mb-4">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-8">{t.mission}</h2>
            <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              "Give the ownership of health data to people and change the way healthcare is provided, through innovation
              and increasing the proximity to doctors."
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              {
                icon: Eye,
                title: "Data Ownership",
                description: "Putting patients in control of their health information",
              },
              {
                icon: Zap,
                title: "Healthcare Innovation",
                description: "Reimagining how healthcare services are delivered",
              },
              {
                icon: Users,
                title: "Doctor Proximity",
                description: "Bringing patients and healthcare providers closer together",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full text-center p-6">
                  <CardContent className="p-0">
                    <item.icon className="w-12 h-12 text-teal-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.values}</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </motion.div>

          <div className="space-y-12">
            {[
              {
                number: "1",
                title: "Patient Centered",
                description:
                  "Our primary focus is giving patients full control over their health journey. Every feature is designed with the patient's needs and autonomy in mind.",
              },
              {
                number: "2",
                title: "Security and Privacy as Core",
                description:
                  "Health data is sensitive. We implement the highest security standards to keep your information safe. Patients decide who has access to their information and can track it.",
              },
              {
                number: "3",
                title: "Innovative Care",
                description:
                  "We're reimagining healthcare by connecting patients and providers with seamless communication, changing the patient experience while ensuring professionals are more productive and independent.",
              },
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ x: index % 2 === 0 ? -100 : 100, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className={`flex items-center gap-8 ${index % 2 === 1 ? "flex-row-reverse" : ""}`}
              >
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">{value.number}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold mb-4">{value.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Logo size="sm" className="mb-4" />
              <p className="text-gray-400">
                Contact:{" "}
                <a href="mailto:info@saluso.com" className="text-teal-400 hover:text-teal-300">
                  info@saluso.com
                </a>
              </p>
            </div>
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Terms & Conditions
              </Link>
              <p className="text-gray-400">© 2025 Saluso. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Welcome Back</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" placeholder="your@email.com" />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" type="password" placeholder="••••••••" />
            </div>
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={() => {
                setLoginOpen(false)
                window.location.href = "/patient/dashboard"
              }}
            >
              Login
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Create Your Account</DialogTitle>
          </DialogHeader>
          <form className="space-y-4">
            <div>
              <Label htmlFor="signup-name">Full Name</Label>
              <Input id="signup-name" placeholder="John Doe" />
            </div>
            <div>
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" type="email" placeholder="your@email.com" />
            </div>
            <div>
              <Label htmlFor="signup-mobile">Mobile</Label>
              <Input id="signup-mobile" type="tel" placeholder="+351 123 456 789" />
            </div>
            <div>
              <Label htmlFor="signup-dob">Date of Birth</Label>
              <Input id="signup-dob" type="date" />
            </div>
            <div>
              <Label htmlFor="signup-location">Location</Label>
              <Input id="signup-location" placeholder="Lisbon, Portugal" />
            </div>
            <div>
              <Label htmlFor="signup-password">Password</Label>
              <Input id="signup-password" type="password" placeholder="••••••••" />
            </div>
            <Button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={() => {
                setSignupOpen(false)
                window.location.href = "/patient/dashboard"
              }}
            >
              Create Account
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
