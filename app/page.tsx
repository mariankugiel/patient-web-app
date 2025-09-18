"use client"

import { useState, useEffect } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useDispatch, useSelector } from "react-redux"
import { RootState, AppDispatch } from "@/lib/store"
import { signupUser, loginUser } from "@/lib/features/auth/authThunks"
import { useAuthRedirect } from "@/hooks/use-auth-redirect"
import {
  Heart,
  Shield,
  Users,
  FileText,
  Smartphone,
  Upload,
  CheckCircle,
  Lock,
  Globe,
  Target,
  User,
  Zap,
  Brain,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { toast } from "react-toastify"

export default function LandingPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { isLoading, error } = useSelector((state: RootState) => state.auth)
  
  // Use auth redirect hook to handle automatic redirects
  useAuthRedirect()
  const [language, setLanguage] = useState<"en" | "pt">("en")
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })

  const { scrollYProgress } = useScroll()
  const headerBackground = useTransform(
    scrollYProgress,
    [0, 0.1],
    ["rgba(230, 247, 247, 0.9)", "rgba(255, 255, 255, 0.95)"],
  )

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const translations = {
    en: {
      // Navigation
      login: "Login",
      createAccount: "Create Account",
      healthProfessionals: "Health Professionals",

      // Hero
      heroTitle: "Your Health, One Place",
      heroSubtitle:
        "Centralize all your health and wellness data, connect with healthcare professionals, and take control of your healthcare journey.",

      // Features
      featuresTitle: "Key Features",
      feature1Title: "Centralized Health Records",
      feature1Desc: "All your medical data in one secure place",
      feature2Title: "Doctor Communication",
      feature2Desc: "Direct messaging with healthcare providers",
      feature3Title: "Wearable Integration",
      feature3Desc: "Connect your fitness trackers and health devices",
      feature4Title: "Medication Management",
      feature4Desc: "Track prescriptions and set reminders",
      feature5Title: "AI-Powered Insights",
      feature5Desc: "Receive personalized health insights and recommendations based on your data",
      feature6Title: "Make your Health Plan",
      feature6Desc: "Define and measure the goals and set activities and track them",

      // Preventive Medicine
      preventiveMedicineTitle: "Changing the way preventive medicine is done",
      preventive1: "The doctor can easily see your history and medical records",
      preventive2: "Doctor can setup goals to improve health and track them",
      preventive3: "You can discuss directly with your doctor easily",
      preventive4: "If you are not progressing well, your doctor will receive an alert and can adjust your health plan",

      // Steps
      stepsTitle: "3 Easy Steps to Start Improving Your Health",
      step1Title: "Create Account",
      step1Desc: "Sign up and set up your secure health profile",
      step2Title: "Share Data",
      step2Desc: "Connect wearables and upload blood analysis or reports",
      step3Title: "Enjoy",
      step3Desc: "Take control of your health journey with personalized insights",

      // Security
      securityTitle: "Your Data is Secure",
      hipaa: "HIPAA Compliant",
      gdpr: "GDPR Compliant",
      encryption: "End-to-End Encryption",

      // Mission
      missionTitle: "Our Mission",
      missionText:
        "Give the ownership of health data to people and change the way healthcare is provided, through innovation and increasing the proximity to doctors.",
      dataOwnership: "Data Ownership",
      dataOwnershipDesc: "Putting patients in control of their health information",
      healthcareInnovation: "Healthcare Innovation",
      healthcareInnovationDesc: "Reimagining how healthcare services are delivered",
      doctorProximity: "Doctor Proximity",
      doctorProximityDesc: "Bringing patients and healthcare providers closer together",

      value1Title: "Patient Centered",
      value1Desc: "Primary focus and give full control over health journey",
      value2Title: "Security and Privacy as its Core",
      value2Desc:
        "Health data is sensitive. We implement the highest security standards to keep your information safe. Patients are the ones that decide who has access to their information and should be able to track it.",
      value3Title: "Innovative Care",
      value3Desc:
        "Reimagining healthcare by connecting patients and providers with seamless communication, to change the experience to patients and ensure that professionals are more productive (less administration) and independent.",

      // Footer
      privacyPolicy: "Privacy Policy",
      termsConditions: "Terms & Conditions",
      copyright: "© 2025 Saluso. All rights reserved.",

      // Forms
      email: "Email",
      password: "Password",
      name: "Full Name",
      mobile: "Mobile",
      dateOfBirth: "Date of Birth",
      location: "Location",
      enterEmail: "Enter your email",
      enterPassword: "Enter your password",
      enterName: "Enter your full name",
      enterMobile: "Enter your mobile number",
      enterLocation: "Enter your location",
    },
    pt: {
      // Navigation
      login: "Entrar",
      createAccount: "Criar Conta",
      healthProfessionals: "Profissionais de Saúde",

      // Hero
      heroTitle: "A Sua Saúde, Num Lugar",
      heroSubtitle:
        "Centralize todos os seus dados de saúde e bem-estar, conecte-se com profissionais de saúde e assuma o controlo da sua jornada de saúde.",

      // Features
      featuresTitle: "Funcionalidades Principais",
      feature1Title: "Registos de Saúde Centralizados",
      feature1Desc: "Todos os seus dados médicos num local seguro",
      feature2Title: "Comunicação com Médicos",
      feature2Desc: "Mensagens diretas com profissionais de saúde",
      feature3Title: "Integração de Wearables",
      feature3Desc: "Conecte os seus dispositivos de fitness e saúde",
      feature4Title: "Gestão de Medicamentos",
      feature4Desc: "Acompanhe prescrições e defina lembretes",
      feature5Title: "Insights com IA",
      feature5Desc: "Receba insights de saúde personalizados e recomendações baseadas nos seus dados",
      feature6Title: "Faça o seu Plano de Saúde",
      feature6Desc: "Defina e meça os objetivos e defina atividades e acompanhe-os",

      // Preventive Medicine
      preventiveMedicineTitle: "Mudando a forma como a medicina preventiva é feita",
      preventive1: "O médico pode ver facilmente o seu histórico e registos médicos",
      preventive2: "O médico pode definir objetivos para melhorar a saúde e acompanhá-los",
      preventive3: "Pode discutir diretamente com o seu médico facilmente",
      preventive4:
        "Se não estiver a progredir bem, o seu médico receberá um alerta e pode ajustar o seu plano de saúde",

      // Steps
      stepsTitle: "3 Passos Fáceis para Começar a Melhorar a Sua Saúde",
      step1Title: "Criar Conta",
      step1Desc: "Registe-se e configure o seu perfil de saúde seguro",
      step2Title: "Partilhar Dados",
      step2Desc: "Conecte wearables e carregue análises de sangue ou relatórios",
      step3Title: "Desfrutar",
      step3Desc: "Tome controlo da sua jornada de saúde com insights personalizados",

      // Security
      securityTitle: "Os Seus Dados Estão Seguros",
      hipaa: "Conforme HIPAA",
      gdpr: "Conforme GDPR",
      encryption: "Encriptação Ponta-a-Ponta",

      // Mission
      missionTitle: "A Nossa Missão",
      missionText:
        "Dar a propriedade dos dados de saúde às pessoas e mudar a forma como os cuidados de saúde são prestados, através da inovação e do aumento da proximidade aos médicos.",
      dataOwnership: "Propriedade dos Dados",
      dataOwnershipDesc: "Colocar os pacientes no controlo da sua informação de saúde",
      healthcareInnovation: "Inovação em Saúde",
      healthcareInnovationDesc: "Reimaginar como os serviços de saúde são prestados",
      doctorProximity: "Proximidade ao Médico",
      doctorProximityDesc: "Aproximar pacientes e profissionais de saúde",

      value1Title: "Centrado no Paciente",
      value1Desc: "Foco principal e dar controlo total sobre a jornada de saúde",
      value2Title: "Segurança e Privacidade como Base",
      value2Desc:
        "Os dados de saúde são sensíveis. Implementamos os mais altos padrões de segurança para manter a sua informação segura. Os pacientes são os que decidem quem tem acesso à sua informação e devem poder rastreá-la.",
      value3Title: "Cuidados Inovadores",
      value3Desc:
        "Reimaginar os cuidados de saúde conectando pacientes e profissionais com comunicação perfeita, para mudar a experiência dos pacientes e garantir que os profissionais sejam mais produtivos (menos administração) e independentes.",

      // Footer
      privacyPolicy: "Política de Privacidade",
      termsConditions: "Termos e Condições",
      copyright: "© 2025 Saluso. All rights reserved.",

      // Forms
      email: "Email",
      password: "Palavra-passe",
      name: "Nome Completo",
      mobile: "Telemóvel",
      dateOfBirth: "Data de Nascimento",
      location: "Localização",
      enterEmail: "Introduza o seu email",
      enterPassword: "Introduza a sua palavra-passe",
      enterName: "Introduza o seu nome completo",
      enterMobile: "Introduza o seu número de telemóvel",
      enterLocation: "Introduza a sua localização",
    },
  }

  const t = translations[language]

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate full name
    if (!signupForm.name || signupForm.name.trim().length < 2) {
      toast.error("Please enter your full name (at least 2 characters).")
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(signupForm.email)) {
      toast.error("Please enter a valid email address.")
      return
    }
    
    // Validate password strength
    if (signupForm.password.length < 6) {
      toast.error("Password must be at least 6 characters long.")
      return
    }
    
    // Validate password confirmation
    if (signupForm.password !== signupForm.confirmPassword) {
      toast.error("Passwords do not match. Please try again.")
      return
    }
    
    try {
      await dispatch(signupUser({
        email: signupForm.email,
        password: signupForm.password,
        fullName: signupForm.name.trim(),
      })).unwrap()
      
      // Close modal on successful signup
      setShowSignupModal(false)
      // The useAuthRedirect hook will handle the redirect to onboarding
    } catch (error) {
      console.error('Signup failed:', error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setSignupForm(prev => ({ ...prev, [field]: value }))
  }

  const handleLoginInputChange = (field: string, value: string) => {
    setLoginForm(prev => ({ ...prev, [field]: value }))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(loginForm.email)) {
      toast.error("Please enter a valid email address.")
      return
    }
    
    // Validate password
    if (!loginForm.password || loginForm.password.length < 1) {
      toast.error("Please enter your password.")
      return
    }
    
    try {
      await dispatch(loginUser({
        email: loginForm.email,
        password: loginForm.password,
      })).unwrap()
      
      // Close modal on successful login
      setShowLoginModal(false)
      // The useAuthRedirect hook will handle the redirect based on onboarding status
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-teal-100/20 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.02,
            y: mousePosition.y * 0.02,
          }}
          style={{
            left: "10%",
            top: "20%",
          }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-teal-50/30 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -0.01,
            y: mousePosition.y * -0.01,
          }}
          style={{
            right: "15%",
            bottom: "30%",
          }}
        />
      </div>

      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/20"
        style={{
          backgroundColor: headerBackground,
        }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="pl-2 lg:pl-4"
          >
            <Logo size="sm" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <a
              href="https://www.saluso-pro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center px-6 py-2 text-sm bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
            >
              {t.healthProfessionals}
            </a>
          </motion.div>

          <div className="flex items-center space-x-4">
            <motion.button
              onClick={() => setLanguage(language === "en" ? "pt" : "en")}
              className="px-4 py-2 text-sm border border-teal-200 rounded-full hover:bg-teal-50 transition-all duration-300 font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {language.toUpperCase()}
            </motion.button>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button
                variant="ghost"
                onClick={() => setShowLoginModal(true)}
                className="text-teal-600 hover:bg-teal-50 font-medium"
              >
                {t.login}
              </Button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setShowSignupModal(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                >
                  {t.createAccount}
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative" style={{ backgroundColor: "#E6F7F7" }}>
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <h1 className="text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
                  <motion.span
                    className="text-teal-600 inline-block"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    {t.heroTitle.split(",")[0]},
                  </motion.span>
                  <br />
                  <motion.span
                    className="text-gray-900 inline-block"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    {t.heroTitle.split(",")[1]}
                  </motion.span>
                </h1>
              </motion.div>

              <motion.p
                className="text-xl text-gray-600 leading-relaxed max-w-lg font-light"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {t.heroSubtitle}
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1 }}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    variant="outline"
                    className="border-2 border-teal-200 text-teal-600 hover:bg-teal-50 h-14 px-8 text-lg font-medium group"
                  >
                    {t.login}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={() => setShowSignupModal(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white h-14 px-8 text-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-300 group"
                  >
                    <Sparkles className="mr-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
                    {t.createAccount}
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative"
            >
              <motion.img
                src="/images/hero-woman-phone-v3.png"
                alt="Woman using health app"
                className="w-full h-auto max-w-md mx-auto drop-shadow-2xl"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">{t.featuresTitle}</h2>
            <div className="w-24 h-1 bg-teal-600 mx-auto rounded-full" />
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: FileText, title: t.feature1Title, desc: t.feature1Desc, color: "from-blue-500 to-cyan-500" },
              { icon: Users, title: t.feature2Title, desc: t.feature2Desc, color: "from-green-500 to-teal-500" },
              { icon: Smartphone, title: t.feature3Title, desc: t.feature3Desc, color: "from-purple-500 to-pink-500" },
              { icon: Heart, title: t.feature4Title, desc: t.feature4Desc, color: "from-red-500 to-orange-500" },
              { icon: Brain, title: t.feature5Title, desc: t.feature5Desc, color: "from-indigo-500 to-purple-500" },
              { icon: Target, title: t.feature6Title, desc: t.feature6Desc, color: "from-teal-500 to-green-500" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm group">
                  <CardContent className="p-8 text-center">
                    <motion.div
                      className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preventive Medicine Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">{t.preventiveMedicineTitle}</h2>
            <div className="w-24 h-1 bg-teal-600 mx-auto rounded-full" />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              { icon: FileText, text: t.preventive1, color: "from-blue-500 to-cyan-500" },
              { icon: Target, text: t.preventive2, color: "from-green-500 to-teal-500" },
              { icon: MessageCircle, text: t.preventive3, color: "from-purple-500 to-pink-500" },
              { icon: AlertTriangle, text: t.preventive4, color: "from-orange-500 to-red-500" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="flex items-start space-x-6 group"
                whileHover={{ x: 10 }}
              >
                <motion.div
                  className={`w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                >
                  <item.icon className="w-6 h-6 text-white" />
                </motion.div>
                <p className="text-gray-700 text-lg leading-relaxed font-light">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">{t.stepsTitle}</h2>
            <div className="w-24 h-1 bg-teal-600 mx-auto rounded-full" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: User, title: t.step1Title, desc: t.step1Desc, number: "1" },
              { icon: Upload, title: t.step2Title, desc: t.step2Desc, number: "2" },
              { icon: CheckCircle, title: t.step3Title, desc: t.step3Desc, number: "3" },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center group"
                whileHover={{ y: -10 }}
              >
                <div className="relative mb-8">
                  <motion.div
                    className="w-24 h-24 bg-gradient-to-r from-teal-600 to-teal-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <span className="text-3xl font-bold text-white">{step.number}</span>
                  </motion.div>
                  <motion.div
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg"
                    whileHover={{ scale: 1.2 }}
                  >
                    <step.icon className="w-5 h-5 text-teal-600" />
                  </motion.div>
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">{step.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed font-light">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">{t.securityTitle}</h2>
            <div className="w-24 h-1 bg-teal-600 mx-auto rounded-full" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Shield, title: t.hipaa, color: "from-green-500 to-emerald-500" },
              { icon: Globe, title: t.gdpr, color: "from-blue-500 to-indigo-500" },
              { icon: Lock, title: t.encryption, color: "from-purple-500 to-violet-500" },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
                whileHover={{ y: -10 }}
              >
                <motion.div
                  className={`w-20 h-20 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <item.icon className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-8 tracking-tight">{t.missionTitle}</h2>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed font-light">{t.missionText}</p>
            <div className="w-24 h-1 bg-teal-600 mx-auto rounded-full mt-8" />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Target, title: t.dataOwnership, desc: t.dataOwnershipDesc, color: "from-teal-500 to-cyan-500" },
              {
                icon: Zap,
                title: t.healthcareInnovation,
                desc: t.healthcareInnovationDesc,
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: Users,
                title: t.doctorProximity,
                desc: t.doctorProximityDesc,
                color: "from-blue-500 to-indigo-500",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
              >
                <Card className="h-full hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm group">
                  <CardContent className="p-8 text-center">
                    <motion.div
                      className={`w-16 h-16 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <item.icon className="w-8 h-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-4 text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed font-light">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section id="values" className="py-20 px-6 bg-gray-50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">Our Values</h2>
            <div className="w-24 h-1 bg-teal-600 mx-auto rounded-full" />
          </motion.div>

          <div className="space-y-12">
            {[
              { icon: Heart, title: t.value1Title, desc: t.value1Desc, color: "from-red-500 to-pink-500" },
              { icon: Shield, title: t.value2Title, desc: t.value2Desc, color: "from-green-500 to-teal-500" },
              { icon: Zap, title: t.value3Title, desc: t.value3Desc, color: "from-purple-500 to-indigo-500" },
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ x: 10 }}
              >
                <Card className="hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm group">
                  <CardContent className="p-10">
                    <div className="flex items-start space-x-8">
                      <motion.div
                        className={`w-16 h-16 bg-gradient-to-r ${value.color} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <value.icon className="w-8 h-8 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-semibold mb-4 text-gray-900">{value.title}</h3>
                        <p className="text-gray-600 text-lg leading-relaxed font-light">{value.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-16 px-6 bg-gray-900 text-white">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0"
          >
            <div className="flex items-center space-x-8">
              <motion.a
                href="mailto:info@saluso.com"
                className="hover:text-teal-400 transition-colors font-medium"
                whileHover={{ scale: 1.05 }}
              >
                info@saluso.com
              </motion.a>
              <motion.a
                href="#"
                className="hover:text-teal-400 transition-colors font-medium"
                whileHover={{ scale: 1.05 }}
              >
                {t.privacyPolicy}
              </motion.a>
              <motion.a
                href="#"
                className="hover:text-teal-400 transition-colors font-medium"
                whileHover={{ scale: 1.05 }}
              >
                {t.termsConditions}
              </motion.a>
            </div>
            <p className="text-gray-400 font-light">{t.copyright}</p>
          </motion.div>
        </div>
      </footer>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md border-0 bg-white/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-gray-900">{t.login}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-gray-700 font-medium">
                {t.email}
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder={t.enterEmail}
                value={loginForm.email}
                onChange={(e) => handleLoginInputChange("email", e.target.value)}
                className="h-12 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-gray-700 font-medium">
                {t.password}
              </Label>
              <Input
                id="login-password"
                type="password"
                placeholder={t.enterPassword}
                value={loginForm.password}
                onChange={(e) => handleLoginInputChange("password", e.target.value)}
                className="h-12 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                required
              />
            </div>
            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : t.login}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto border-0 bg-white/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-gray-900">{t.createAccount}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name" className="text-gray-700 font-medium">
                Full Name *
              </Label>
              <Input
                id="signup-name"
                value={signupForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                className="h-12 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-gray-700 font-medium">
                Email Address *
              </Label>
              <Input
                id="signup-email"
                type="email"
                value={signupForm.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                className="h-12 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-gray-700 font-medium">
                Password *
              </Label>
              <Input
                id="signup-password"
                type="password"
                value={signupForm.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter your password (min 6 characters)"
                className="h-12 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password" className="text-gray-700 font-medium">
                Confirm Password *
              </Label>
              <Input
                id="signup-confirm-password"
                type="password"
                value={signupForm.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                className="h-12 border-gray-200 focus:border-teal-500 focus:ring-teal-500"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
