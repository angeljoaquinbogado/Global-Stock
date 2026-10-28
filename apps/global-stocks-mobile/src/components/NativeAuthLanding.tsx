import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo, ActivityIndicator, Animated, Easing, Image, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeTurnstilePrompt } from "./NativeTurnstilePrompt";
import Svg, { Path } from "react-native-svg";
import { StatusBar } from "expo-status-bar";
import { preferenceStorage as SecureStore } from "../lib/preference-storage";
import { SUPPORT_EMAIL, supportEmailUrl } from "../lib/support";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Eye, EyeOff,
  Globe2, LockKeyhole, Moon, ShieldCheck, Sun
} from "lucide-react-native";

function GoogleG() {
  return <Svg width={19} height={19} viewBox="0 0 18 18" accessibilityLabel="Google">
    <Path fill="#4285F4" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.909c1.702-1.567 2.683-3.878 2.683-6.615Z"/>
    <Path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.258c-.806.54-1.835.86-3.047.86-2.344 0-4.328-1.585-5.037-3.714H.957v2.332A9 9 0 0 0 9 18Z"/>
    <Path fill="#FBBC05" d="M3.963 10.708A5.42 5.42 0 0 1 3.682 9c0-.593.102-1.168.281-1.708V4.96H.957A9 9 0 0 0 0 9c0 1.45.347 2.824.957 4.04l3.006-2.332Z"/>
    <Path fill="#EA4335" d="M9 3.58c1.322 0 2.508.454 3.442 1.345l2.582-2.582C13.463.89 11.427 0 9 0A9 9 0 0 0 .957 4.96l3.006 2.332C4.672 5.163 6.656 3.58 9 3.58Z"/>
  </Svg>;
}
type Language = "es" | "en" | "pt";
type Stage = "welcome" | "signin" | "signup";
type Props = {
  onSubmit: (email: string, password: string, captchaToken?: string) => void;
  onRegister: (name: string, email: string, password: string, language: Language, plan: "free" | "starter" | "pro", captchaToken?: string) => void;
  onSocial: (provider: "google") => void;
  registrationComplete: boolean;
  onDemo: () => void;
  loading: boolean;
  error: string;
};
const THEME_KEY = "gs.mobile.theme.v1";
const LANGUAGE_KEY = "gs.mobile.language.v1";
const LEGAL_BASE = "https://globalstocks.vercel.app/legal";
const languages: Array<{ key: Language; name: string }> = [
  { key: "es", name: "Español" },
  { key: "en", name: "English" },
  { key: "pt", name: "Português" }
];
const content = {
  es: {
    welcome: "Bienvenido a", tagline: "Todo tu negocio, conectado.",
    small: "Gestioná tu negocio desde cualquier lugar.", begin: "Comenzar",
    existing: "Ya tengo una cuenta", login: "Iniciar sesión", create: "Crear cuenta",
    newAccount: "Quiero crear una cuenta", back: "Volver", access: "TU ESPACIO",
    demoButton: "Probar demo", demoNotice: "Datos de ejemplo · No registra ventas ni modifica negocios reales",
    signTitle: "Volvé a tu negocio.", signSubtitle: "Ingresá con tu cuenta de Global Stock.",
    signUpTitle: "Empezá con Global Stock.", signUpSubtitle: "Creá una cuenta para la beta gratuita en Argentina.",
    email: "Correo electrónico", password: "Contraseña", checking: "Un momento…",
    adults: "Confirmo que tengo 18 años o más.",
    terms: "Leí y acepto los términos y la política de privacidad.",
    termsLink: "Términos", privacyLink: "Privacidad",
    safe: "Tus datos están protegidos por los permisos de cada negocio.",
    beta: "BETA GRATUITA · ARGENTINA", language: "Idioma de acceso",
    alternate: "Cambiar idioma", light: "Usar tema claro", dark: "Usar tema oscuro",
    lightName: "Claro", darkName: "Oscuro",
    legal: "Beta para mayores de 18 años, con actividad en Argentina.",
    languageNote: ""
  },
  en: {
    welcome: "Welcome to", tagline: "Your whole business. Connected.",
    small: "Manage your business from anywhere.", begin: "Get started",
    existing: "I already have an account", login: "Sign in", create: "Create account",
    newAccount: "Create a new account", back: "Back", access: "YOUR WORKSPACE",
    demoButton: "Try the demo", demoNotice: "Sample data · No real transactions or stock changes",
    signTitle: "Welcome back.", signSubtitle: "Use your existing Global Stock account.",
    signUpTitle: "Start with Global Stock.", signUpSubtitle: "Create an account for the free Argentina beta.",
    email: "Email address", password: "Password", checking: "Please wait…",
    adults: "I confirm I am 18 or older.",
    terms: "I have read and accept the terms and privacy policy.",
    termsLink: "Terms", privacyLink: "Privacy",
    safe: "Your business data is protected by individual permissions.",
    beta: "FREE BETA · ARGENTINA", language: "Sign-in language",
    alternate: "Change language", light: "Use light mode", dark: "Use dark mode",
    lightName: "Light", darkName: "Dark",
    legal: "Beta for adults aged 18+ operating in Argentina.",
    languageNote: "The business dashboard remains in Spanish during the Argentina beta."
  },
  pt: {
    welcome: "Bem-vindo ao", tagline: "Todo o seu negócio, conectado.",
    small: "Gerencie seu negócio de qualquer lugar.", begin: "Começar",
    existing: "Já tenho uma conta", login: "Entrar", create: "Criar conta",
    newAccount: "Criar uma conta", back: "Voltar", access: "SEU ESPAÇO",
    demoButton: "Testar a demo", demoNotice: "Dados de exemplo · Não altera vendas nem estoques reais",
    signTitle: "Bem-vindo de volta.", signSubtitle: "Use sua conta do Global Stock.",
    signUpTitle: "Comece com o Global Stock.", signUpSubtitle: "Crie uma conta para o beta gratuito na Argentina.",
    email: "E-mail", password: "Senha", checking: "Aguarde…",
    adults: "Confirmo que tenho 18 anos ou mais.",
    terms: "Li e aceito os termos e a política de privacidade.",
    termsLink: "Termos", privacyLink: "Privacidade",
    safe: "Os dados da sua empresa são protegidos por permissões individuais.",
    beta: "BETA GRATUITO · ARGENTINA", language: "Idioma de acesso",
    alternate: "Alterar idioma", light: "Usar tema claro", dark: "Usar tema escuro",
    lightName: "Claro", darkName: "Escuro",
    legal: "Beta para maiores de 18 anos que operam na Argentina.",
    languageNote: "O painel de negócios continua em espanhol durante o beta na Argentina."
  }
} as const;
const palette = {
  dark: {
    bg: "#08090D", title: "#FCFCFE", secondary: "#ADB0BE",
    surface: "#17181E", elevated: "#22232C", border: "#363740",
    red: "#D20D23", shadow: "#A4091B", input: "#1C1D24"
  },
  light: {
    bg: "#F6F6F9", title: "#111218", secondary: "#656778",
    surface: "#FFFFFF", elevated: "#EDEDF3", border: "#DDDEE8",
    red: "#A50017", shadow: "#A81022", input: "#F3F3F7"
  }
} as const;

export default function NativeAuthLanding({ onSubmit, onRegister, onSocial, registrationComplete, onDemo, loading, error }: Props) {
  const { height, width } = useWindowDimensions();
  const [stage, setStage] = useState<Stage>("welcome");
  const wipe = useRef(new Animated.Value(0)).current;
  const switchingRef = useRef(false);
  const [switching, setSwitching] = useState(false);
  const [wipeDirection, setWipeDirection] = useState<1 | -1>(1);
  const introLogo = useRef(new Animated.Value(0)).current;
  const introName = useRef(new Animated.Value(0)).current;
  const introZoom = useRef(new Animated.Value(0)).current;
  const introFade = useRef(new Animated.Value(1)).current;
  const [introVisible, setIntroVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dark, setDark] = useState(true);
  const [language, setLanguage] = useState<Language>("es");
  const [openLanguages, setOpenLanguages] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [captchaEnabled, setCaptchaEnabled] = useState<boolean | null>(null);
  const [captchaOpen, setCaptchaOpen] = useState(false);
  const [captchaError, setCaptchaError] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"free" | "starter" | "pro" | null>(null);
  const [password, setPassword] = useState("");
  const [revealPassword, setRevealPassword] = useState(false);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const p = dark ? palette.dark : palette.light;
  const t = content[language];
  const compact = height < 730;
  const logoSize = Math.min(compact ? 116 : 146, Math.floor(width * 0.39));
  const signup = stage === "signup";
  const form = stage !== "welcome";
  const styles = createStyles(p);
  const wipeX = wipe.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [-width * 1.55, 0, width * 1.55]
  });

  useEffect(() => {
    if (registrationComplete) {
      setStage("signin");
      setPassword("");
      setRevealPassword(false);
    }
  }, [registrationComplete]);

  useEffect(() => {
    let active = true;
    let runner: Animated.CompositeAnimation | null = null;
    void AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active) return;
      if (reduce) { setIntroVisible(false); return; }
      runner = Animated.sequence([
        Animated.timing(introLogo, { toValue: 1, duration: 770, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
        Animated.timing(introName, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.delay(550),
        Animated.parallel([
          Animated.timing(introName, { toValue: 0, duration: 220, useNativeDriver: true }),
          Animated.timing(introZoom, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.cubic), useNativeDriver: true })
        ]),
        Animated.timing(introFade, { toValue: 0, duration: 280, useNativeDriver: true })
      ]);
      runner.start(({ finished }) => { if (active && finished) setIntroVisible(false); });
    }).catch(() => { if (active) setIntroVisible(false); });
    return () => { active = false; runner?.stop(); };
  }, [introLogo, introName, introZoom, introFade]);

  useEffect(() => {
    let alive = true;
    void Promise.all([
      SecureStore.getItemAsync(THEME_KEY),
      SecureStore.getItemAsync(LANGUAGE_KEY)
    ]).then(([theme,lang]) => {
      if (!alive) return;
      if (theme === "dark" || theme === "light") setDark(theme === "dark");
      if (lang === "es" || lang === "en" || lang === "pt") setLanguage(lang);
    }).catch(() => null);
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then(value => { if (mounted) setReducedMotion(value); })
      .catch(() => null);
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged", setReducedMotion
    );
    return () => {
      mounted = false;
      listener.remove();
      wipe.stopAnimation();
    };
  }, [wipe]);

  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    void fetch("https://globalstocks.vercel.app/api/auth/turnstile-config", {
      signal: controller.signal,
      cache: "no-store"
    }).then(async response => {
      if (!response.ok) throw new Error("Captcha configuration unavailable");
      const data = await response.json() as { enabled?: boolean };
      if (live) {
        setCaptchaEnabled(data.enabled === true);
        setCaptchaError("");
      }
    }).catch(() => {
      if (live) {
        setCaptchaEnabled(null);
        setCaptchaError("No se pudo comprobar la protección antibots. Probá conectarte a internet o ingresá desde la web.");
      }
    });
    return () => { live = false; controller.abort(); };
  }, []);

  useEffect(() => {
    const shown = Keyboard.addListener("keyboardDidShow", () => setKeyboardOpen(true));
    const hidden = Keyboard.addListener("keyboardDidHide", () => setKeyboardOpen(false));
    return () => { shown.remove(); hidden.remove(); };
  }, []);

  function changeTheme(next: boolean) {
    setDark(next);
    void SecureStore.setItemAsync(THEME_KEY, next ? "dark" : "light").catch(() => null);
  }
  function changeLanguage(next: Language) {
    setLanguage(next);
    setOpenLanguages(false);
    void SecureStore.setItemAsync(LANGUAGE_KEY, next).catch(() => null);
  }
  function show(next: Stage) {
    if (switchingRef.current || loading || next === stage) return;
    setCaptchaOpen(false);
    setCaptchaError("");
    setOpenLanguages(false);
    if (stage === "welcome" || next === "welcome" || reducedMotion) {
      setStage(next);
      return;
    }
    // The diagonal brand panel covers the previous form before switching its
    // content; reversing the direction reveals the original login again.
    const forward = next === "signup";
    setWipeDirection(forward ? 1 : -1);
    switchingRef.current = true;
    setSwitching(true);
    wipe.setValue(forward ? 0 : 2);
    Animated.timing(wipe, {
      toValue: 1, duration: 310, easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true
    }).start(({ finished }) => {
      if (!finished) {
        switchingRef.current = false;
        setSwitching(false);
        return;
      }
      setStage(next);
      Animated.timing(wipe, {
        toValue: forward ? 2 : 0, duration: 350,
        easing: Easing.inOut(Easing.cubic), useNativeDriver: true
      }).start(() => {
        switchingRef.current = false;
        setSwitching(false);
      });
    });
  }
  function submit() {
    if (loading || switchingRef.current || !email.trim() || password.length < 8 ||
        (signup && (fullName.trim().length < 2 || !selectedPlan || !adultConfirmed || !termsConfirmed))) return;
    if (captchaEnabled === null) {
      setCaptchaError("No se pudo comprobar la protección antibots. Revisá la conexión e intentá nuevamente.");
      return;
    }
    if (captchaEnabled) {
      Keyboard.dismiss();
      setCaptchaError("");
      setCaptchaOpen(true);
      return;
    }
    if (signup && selectedPlan) onRegister(fullName.trim(), email.trim(), password, language, selectedPlan);
    else onSubmit(email.trim(), password);
  }

  function acceptCaptcha(token: string) {
    if (!captchaOpen || loading) return;
    setCaptchaOpen(false);
    setCaptchaError("");
    if (signup && selectedPlan) onRegister(fullName.trim(), email.trim(), password, language, selectedPlan, token);
    else onSubmit(email.trim(), password, token);
  }
  function openLegal(path: "terms" | "privacy") {
    void Linking.openURL(`${LEGAL_BASE}/${path}`);
  }

  return (
    <SafeAreaView edges={["top","bottom"]} style={{ flex: 1, backgroundColor: p.bg }}>
      <StatusBar style={dark ? "light" : "dark"} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          scrollEnabled={!form || compact || keyboardOpen}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.page, { minHeight: Math.max(0, height - (Platform.OS === "ios" ? 100 : 45)), paddingTop: compact ? 12 : 18, width: "100%", maxWidth: Platform.OS === "web" && width >= 900 ? 640 : undefined, alignSelf: "center" }]}
        >
          <View style={styles.topRow}>
            {form ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t.back}
                onPress={() => show("welcome")} style={styles.topButton}>
                <ArrowLeft size={19} color={p.title} />
              </Pressable>
            ) : <View style={{ width: 45 }} />}
            <View style={styles.topActions}>
              <Pressable accessibilityRole="button" accessibilityLabel={dark ? t.light : t.dark}
                onPress={() => changeTheme(!dark)} style={styles.topButton}>
                {dark ? <Moon size={17} color={p.title} /> : <Sun size={17} color={p.title} />}
                <Text style={styles.themeLabel}>{dark ? t.darkName : t.lightName}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={t.alternate}
                accessibilityState={{ expanded: openLanguages }}
                onPress={() => setOpenLanguages(!openLanguages)} style={styles.languageButton}>
                <Globe2 size={17} color={p.title} />
                <Text style={styles.languageCode}>{language.toUpperCase()}</Text>
                <ChevronDown size={14} color={p.secondary} />
              </Pressable>
            </View>
            {openLanguages ? (
              <View style={styles.languagePicker}>
              <Text style={styles.smallLabel}>{t.language}</Text>
              {languages.map(item => (
                <Pressable key={item.key} accessibilityRole="button"
                  accessibilityState={{ selected: language === item.key }}
                  onPress={() => changeLanguage(item.key)}
                  style={[styles.languageOption, language === item.key && styles.languageSelected]}>
                  <Text style={[styles.languageOptionText, language === item.key && { color: p.red }]}>
                    {item.name}
                  </Text>
                  {language === item.key ? <Check size={16} color={p.red} /> : null}
                </Pressable>
              ))}
              </View>
            ) : null}
          </View>

          <View style={form ? styles.switchStage : undefined}>
          <View style={[styles.hero, form && styles.compactHero, { paddingTop: form ? 12 : (compact ? 10 : 22) }]}>
            <View style={[styles.logoStage, { height: form ? 74 : (compact ? 194 : 216) }]}>
              <View pointerEvents="none" style={[styles.logoHalo,{ backgroundColor: dark ? "rgba(180,18,42,0.14)" : "rgba(194,29,65,0.075)" }]} />
              <Image source={require("../../assets/brand-mark.png")}
                style={{ width: form ? 58 : logoSize, height: form ? 58 : logoSize }}
                resizeMode="contain" accessibilityLabel="Logo de Global Stock" />
            </View>
            {!form ? (
              <>
                <Text style={styles.heroOverline}>{t.welcome}</Text>
                <Text style={styles.heroName}>
                  Global <Text style={{ color: dark ? "#FF515C" : "#B90D22" }}>Stock</Text>
                </Text>
                <Text style={styles.tagline}>{t.tagline}</Text>
                <Text style={styles.heroDescription}>{t.small}</Text>
              </>
            ) : (
              <>
                <Text style={styles.formOverline}>{t.access}</Text>
                <Text style={styles.formHeroTitle}>{signup ? t.signUpTitle : t.signTitle}</Text>
                <Text style={styles.formSubtitle}>{signup ? t.signUpSubtitle : t.signSubtitle}</Text>
              </>
            )}
          </View>

          {!form ? (
            <View style={styles.welcomeActions}>
              <Pressable accessibilityRole="button" onPress={() => show("signup")}
                style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
                <Text style={styles.primaryText}>{t.begin}</Text>
                <ArrowRight size={19} color="#FFFFFF" />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => show("signin")}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryText}>{t.existing}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.authFields}>
              {signup && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{language === "es" ? "Nombre completo" : language === "pt" ? "Nome completo" : "Full name"}</Text>
                  <TextInput style={styles.input} value={fullName} onChangeText={setFullName}
                    accessibilityLabel="Nombre completo" autoComplete="name" textContentType="name"
                    maxLength={120} autoCapitalize="words"
                    placeholder={language === "es" ? "Tu nombre" : "Full name"} placeholderTextColor={p.secondary}/>
                </View>
              )}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t.email}</Text>
                <TextInput
                  style={styles.input} value={email} onChangeText={setEmail}
                  autoComplete="email" textContentType="emailAddress" autoCapitalize="none"
                  autoCorrect={false} keyboardType="email-address" returnKeyType="next"
                  placeholder={t.email} placeholderTextColor={p.secondary}
                  accessibilityLabel={t.email}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{t.password}</Text>
                <View style={styles.passwordField}>
                  <TextInput
                    style={styles.passwordInput} value={password} onChangeText={setPassword}
                    autoCapitalize="none" autoCorrect={false}
                    autoComplete={signup ? "new-password" : "current-password"}
                    textContentType={signup ? "newPassword" : "password"}
                    secureTextEntry={!revealPassword}
                    placeholder={t.password} placeholderTextColor={p.secondary}
                    accessibilityLabel={t.password} returnKeyType="done"
                    onSubmitEditing={submit}
                  />
                  <Pressable accessibilityRole="button" accessibilityLabel={revealPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onPress={() => setRevealPassword(!revealPassword)} style={styles.eyeButton}>
                    {revealPassword ? <EyeOff size={18} color={p.secondary}/> : <Eye size={18} color={p.secondary}/>}
                  </Pressable>
                </View>
              </View>
              {signup ? (
                <View style={{ gap: 8 }}>
                  <Text style={styles.fieldLabel}>{language === "es" ? "Elegí tu plan · 15 días de prueba sin cobro automático" : language === "pt" ? "Escolha seu plano · 15 dias de teste sem cobrança automática" : "Choose your plan · 15-day trial, no automatic charge"}</Text>
                  <View style={{ flexDirection: "row", gap: 7 }}>
                    {([
                      { id: "free", name: language === "es" ? "Gratis" : "Free", price: "$0" },
                      { id: "starter", name: "Emprendedor", price: "US$ 5 / mes" },
                      { id: "pro", name: "Profesional", price: "US$ 10 / mes" }
                    ] as const).map(plan => (
                      <Pressable key={plan.id} accessibilityRole="radio" accessibilityState={{ selected: selectedPlan === plan.id }}
                        onPress={() => setSelectedPlan(plan.id)}
                        style={{ flex: 1, minHeight: 62, borderRadius: 12, borderWidth: 1, borderColor: selectedPlan === plan.id ? p.red : p.border, backgroundColor: selectedPlan === plan.id ? p.red + "12" : p.surface, padding: 8, justifyContent: "center" }}>
                        <Text style={{ color: p.title, fontSize: 10, fontWeight: "700" }}>{plan.name}</Text>
                        <Text style={{ color: p.title, fontSize: 13, fontWeight: "800", marginTop: 3 }}>{plan.price}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={{ color: p.secondary, fontSize: 10, lineHeight: 14 }}>
                    {language === "es" ? "Al finalizar la prueba no se te cobra automáticamente. Los planes pagos requerirán confirmación." : "No automatic charge after the trial. Paid plans require confirmation."}
                  </Text>
                </View>
              ) : null}
              {signup ? (
                <View style={styles.consents}>
                  <Pressable accessibilityRole="checkbox"
                    accessibilityLabel="Declaro ser mayor de 18 años y aceptar los términos y la privacidad"
                    accessibilityState={{checked:adultConfirmed && termsConfirmed}}
                    onPress={() => {
                      const next = !(adultConfirmed && termsConfirmed);
                      setAdultConfirmed(next);
                      setTermsConfirmed(next);
                    }} style={styles.consentRow}>
                    <View style={[styles.checkbox,adultConfirmed&&termsConfirmed&&styles.checkboxActive]}>
                      {adultConfirmed&&termsConfirmed?<Check size={14} color="#FFFFFF"/>:null}
                    </View>
                    <Text style={styles.consentText}>
                      {language==="es" ? "Tengo al menos 18 años, mi negocio opera en Argentina y acepto los términos y la privacidad."
                        : language==="pt" ? "Tenho 18 anos ou mais, opero na Argentina e aceito os termos e a privacidade."
                        : "I am at least 18, operate in Argentina, and accept the terms and privacy policy."}
                    </Text>
                  </Pressable>
                  <View style={styles.legalLinks}>
                    <Pressable accessibilityRole="link" onPress={() => openLegal("terms")}>
                      <Text style={styles.legalLink}>{t.termsLink} ↗</Text>
                    </Pressable>
                    <Pressable accessibilityRole="link" onPress={() => openLegal("privacy")}>
                      <Text style={styles.legalLink}>{t.privacyLink} ↗</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              {captchaError ? <View style={styles.authError}>
                <Text accessibilityRole="alert" style={styles.error}>{captchaError}</Text>
              </View> : null}
              {error ? <View style={styles.authError}>
                <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
                <Pressable accessibilityRole="link" onPress={()=>void Linking.openURL(supportEmailUrl("Problema de acceso a Global Stock"))}>
                  <Text style={styles.supportEmail}>{SUPPORT_EMAIL}</Text>
                </Pressable>
              </View> : null}
              <Pressable accessibilityRole="button" accessibilityLabel={signup ? t.create : t.login}
                disabled={loading || captchaEnabled === null || !email.trim() || password.length < 8 || (signup && (fullName.trim().length < 2 || !selectedPlan || !adultConfirmed || !termsConfirmed))}
                onPress={submit}
                style={({pressed}) => [
                  styles.primary,
                  (loading || captchaEnabled === null || !email.trim() || password.length < 8 || (signup && (fullName.trim().length < 2 || !selectedPlan || !adultConfirmed || !termsConfirmed))) && { opacity: 0.48 },
                  pressed && styles.pressed
                ]}>
                {loading ? <ActivityIndicator color="#fff"/> : <>
                  <Text style={styles.primaryText}>{signup ? t.create : t.login}</Text>
                  <ArrowRight size={18} color="#fff"/>
                </>}
              </Pressable>
              {!signup && (
                <View style={{ gap: 9 }}>
                  <Text style={[styles.explanation, { textAlign: "center" }]}>
                    {language === "es" ? "O continuá con" : language === "pt" ? "Ou continue com" : "Or continue with"}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 9 }}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Continuar con Google"
                      disabled={loading} onPress={() => onSocial("google")}
                      style={({pressed}) => [styles.socialButton,pressed&&styles.pressed]}>
                      <GoogleG/>
                      <Text style={[styles.secondaryText,{fontSize:13}]}>Google</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              {!signup && (
                <Pressable accessibilityRole="button" accessibilityLabel={t.demoButton}
                  disabled={loading} onPress={onDemo}
                  style={{ alignSelf:"center", paddingVertical:6, paddingHorizontal:10 }}>
                  <Text style={{ color:p.secondary, fontSize:11, fontWeight:"600" }}>
                    {t.demoButton} · {language === "es" ? "sin modificar datos reales" : language === "pt" ? "sem alterar dados reais" : "no real data changes"}
                  </Text>
                </Pressable>
              )}
              <Pressable accessibilityRole="button"
                onPress={() => show(signup ? "signin" : "signup")} style={styles.switchLink}>
                <Text style={styles.switchText}>{signup ? t.existing : t.newAccount}</Text>
                <ArrowRight size={14} color={p.red}/>
              </Pressable>
            </View>
          )}

          {switching ? (
            <Animated.View pointerEvents="auto" accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.switchCurtain, {
                width: width * 1.22,
                transform: [
                  { translateX: wipeX },
                  { skewX: wipeDirection === 1 ? "-12deg" : "12deg" }
                ]
              }]}>
              <Image source={require("../../assets/brand-mark.png")}
                style={{ width: 58, height: 58 }} resizeMode="contain" />
              <Text style={styles.switchBrand}>GLOBAL STOCK</Text>
              <Text style={styles.switchBrandSub}>
                {language === "es" ? "Tu negocio, en orden." :
                  language === "pt" ? "Seu negócio em ordem." :
                  "Your business, organized."}
              </Text>
            </Animated.View>
          ) : null}
          </View>

          {!form && <View style={styles.bottomNote}>
            <View style={styles.betaPill}>
              <View style={styles.betaDot}/>
              <Text style={styles.betaText}>{t.beta}</Text>
            </View>
            <View style={styles.safeRow}>
              <LockKeyhole size={13} color={p.secondary} />
              <Text style={styles.safeText}>{t.safe}</Text>
            </View>
            {t.languageNote ? <Text style={styles.explanation}>{t.languageNote}</Text> : null}
            <Text style={styles.explanation}>{t.legal}</Text>
          </View>}
        </ScrollView>
      </KeyboardAvoidingView>
      <NativeTurnstilePrompt
        visible={captchaOpen}
        onCancel={() => setCaptchaOpen(false)}
        onVerified={acceptCaptcha}
      />
      {introVisible && (
        <Animated.View pointerEvents="auto" accessibilityLabel="Intro de Global Stock"
          style={[StyleSheet.absoluteFill, { zIndex:100, backgroundColor:p.bg,
            alignItems:"center", justifyContent:"center", opacity:introFade }]}>
          <Animated.Image source={require("../../assets/brand-mark.png")} resizeMode="contain"
            style={{width:Math.min(width*.48,195),height:Math.min(width*.48,195),
              opacity:introLogo,transform:[
                {scale:Animated.multiply(introLogo.interpolate({inputRange:[0,1],outputRange:[.2,1]}),
                  introZoom.interpolate({inputRange:[0,1],outputRange:[1,6]}))},
                {rotate:introLogo.interpolate({inputRange:[0,1],outputRange:["-25deg","0deg"]})}
              ]}}/>
          <Animated.Text style={{position:"absolute",top:"62%",fontSize:28,fontWeight:"900",
            color:p.title,letterSpacing:-1,opacity:introName,
            transform:[{translateY:introName.interpolate({inputRange:[0,1],outputRange:[12,0]})}]}}>
            Global <Text style={{color:p.red}}>Stock</Text>
          </Animated.Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function createStyles(p: typeof palette.dark | typeof palette.light) {
  return StyleSheet.create({
    page: { flexGrow: 1, paddingHorizontal: 23, paddingBottom: 22 },
    topRow: { position:"relative",flexDirection:"row",justifyContent:"space-between",alignItems:"center",minHeight:48,zIndex:30,overflow:"visible" },
    topActions: { flexDirection:"row",alignItems:"center",gap:9 },
    topButton: { minWidth:44,height:44,borderRadius:15,borderWidth:1,borderColor:p.border,backgroundColor:p.surface,justifyContent:"center",alignItems:"center",flexDirection:"row",gap:7,paddingHorizontal:12 },
    themeLabel: { color:p.title,fontSize:12,fontWeight:"700" },
    languageButton: { minHeight:44,borderRadius:15,borderWidth:1,borderColor:p.border,backgroundColor:p.surface,flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:11 },
    languageCode: { fontSize:12,fontWeight:"800",color:p.title },
    languagePicker: { position:"absolute",top:54,right:0,width:190,borderWidth:1,borderColor:p.border,borderRadius:17,backgroundColor:p.surface,padding:12,gap:6,zIndex:40,elevation:10,shadowColor:"#000",shadowOffset:{width:0,height:8},shadowOpacity:0.12,shadowRadius:18 },
    smallLabel: { fontSize:10,fontWeight:"700",color:p.secondary,marginBottom:3 },
    languageOption: { flexDirection:"row",justifyContent:"space-between",alignItems:"center",paddingVertical:10,paddingHorizontal:10,borderRadius:10 },
    languageSelected: { backgroundColor:p.elevated },
    languageOptionText: { fontSize:13,fontWeight:"700",color:p.title },
    switchStage: { position:"relative", overflow:"hidden", borderRadius:20 },
    socialButton: { flex:1, minHeight:47, borderRadius:14, borderWidth:1, borderColor:p.border, backgroundColor:p.surface, flexDirection:"row", alignItems:"center", justifyContent:"center", gap:9 },
    switchCurtain: {
      position:"absolute", top:0, bottom:0, left:0, zIndex:45,
      backgroundColor:"#250A13", justifyContent:"center", alignItems:"center",
      gap:10, borderWidth:0
    },
    switchBrand: { color:"#FFFFFF", fontSize:19, fontWeight:"900", letterSpacing:2.4 },
    switchBrandSub: { color:"#FFD9DF", fontSize:12, fontWeight:"600" },
    hero: { flexGrow:1,alignItems:"center",justifyContent:"flex-start",paddingBottom:18,minHeight:320 },
    compactHero: { flexGrow:0,minHeight:0,paddingBottom:10,justifyContent:"center" },
    logoStage: { position:"relative",width:"100%",alignItems:"center",justifyContent:"center",marginBottom:22,flexShrink:0,overflow:"visible" },
    logoHalo: { position:"absolute",width:174,height:174,borderRadius:87,shadowColor:"#C71C35",shadowOpacity:0.17,shadowRadius:44,shadowOffset:{width:0,height:0} },
    heroOverline: { color:p.secondary,fontSize:14,fontWeight:"600",marginTop:0,textAlign:"center",flexShrink:0 },
    heroName: { color:p.title,fontSize:40,fontWeight:"900",letterSpacing:-1.9,textAlign:"center",marginTop:5,flexShrink:0 },
    tagline: { color:p.title,fontSize:19,fontWeight:"700",textAlign:"center",marginTop:13,letterSpacing:-0.2 },
    heroDescription: { color:p.secondary,fontSize:13.5,lineHeight:21,textAlign:"center",marginTop:9,maxWidth:280 },
    formOverline: { color:p.red,fontSize:10,fontWeight:"900",letterSpacing:2.3,marginTop:8,textAlign:"center" },
    formHeroTitle: { color:p.title,fontSize:25,fontWeight:"800",letterSpacing:-0.8,marginTop:10,textAlign:"center" },
    formSubtitle: { color:p.secondary,fontSize:12.5,lineHeight:19,marginTop:8,textAlign:"center" },
    welcomeActions: { gap:11,paddingBottom:16 },
    primary: { minHeight:50,borderRadius:29,backgroundColor:p.red,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:11,paddingHorizontal:18,shadowColor:p.shadow,shadowOffset:{width:0,height:7},shadowOpacity:0.21,shadowRadius:14,elevation:4 },
    primaryText: { color:"#fff",fontWeight:"800",fontSize:15 },
    secondaryButton: { minHeight:49,borderWidth:1,borderColor:p.border,borderRadius:25,backgroundColor:p.surface,alignItems:"center",justifyContent:"center" },
    secondaryText: { color:p.title,fontWeight:"700",fontSize:14 },
    pressed: { opacity:0.78,transform:[{scale:0.99}] },
    authFields: { gap:12,paddingTop:8,paddingBottom:8 },
    fieldGroup: { gap:7 },
    fieldLabel: { color:p.secondary,fontSize:11,fontWeight:"700" },
    input: { minHeight:44,borderRadius:0,borderColor:p.border,borderBottomWidth:1,backgroundColor:"transparent",paddingHorizontal:8,fontSize:14,color:p.title },
    passwordField: { minHeight:44,borderRadius:0,borderColor:p.border,borderBottomWidth:1,backgroundColor:"transparent",flexDirection:"row",alignItems:"center" },
    passwordInput: { flex:1,paddingHorizontal:15,paddingVertical:13,fontSize:14,color:p.title,minWidth:0 },
    eyeButton: { width:48,height:48,alignItems:"center",justifyContent:"center" },
    consents: { gap:10,paddingVertical:4 },
    consentRow: { flexDirection:"row",alignItems:"flex-start",gap:11,paddingVertical:4 },
    checkbox: { width:22,height:22,borderRadius:7,borderWidth:1.25,borderColor:p.border,backgroundColor:p.surface,justifyContent:"center",alignItems:"center" },
    checkboxActive: { backgroundColor:p.red,borderColor:p.red },
    consentText: { color:p.secondary,fontSize:11.5,lineHeight:19,flex:1 },
    legalLinks: { flexDirection:"row",gap:21,paddingLeft:32 },
    legalLink: { color:p.red,fontSize:12,fontWeight:"700" },
    error: { color:darkWarning(p),fontSize:12,lineHeight:19 },
    authError: { gap:6,backgroundColor:p.surface,borderRadius:12,borderWidth:1,borderColor:p.border,padding:12 },
    supportEmail: { color:p.red,fontSize:12,fontWeight:"700" },
    switchLink: { flexDirection:"row",gap:7,justifyContent:"center",alignItems:"center",paddingVertical:11 },
    switchText: { color:p.title,fontSize:12,fontWeight:"700" },
    bottomNote: { alignItems:"center",gap:9,paddingTop:10 },
    betaPill: { flexDirection:"row",gap:8,alignItems:"center",backgroundColor:p.surface,paddingVertical:8,paddingHorizontal:13,borderRadius:30,borderWidth:1,borderColor:p.border },
    betaDot: {width:6,height:6,borderRadius:4,backgroundColor:"#49BA90"},
    betaText: { fontSize:10,fontWeight:"800",letterSpacing:1.0,color:p.secondary },
    safeRow: { flexDirection:"row",alignItems:"center",justifyContent:"center",gap:6,maxWidth:320 },
    safeText: { color:p.secondary,fontSize:10.5,lineHeight:16,textAlign:"center",flexShrink:1 },
    explanation: { color:p.secondary,fontSize:10,lineHeight:15,textAlign:"center" }
  });
}
function darkWarning(p: typeof palette.dark | typeof palette.light) {
  return p.bg === palette.dark.bg ? "#DF6C78" : "#9F1020";
}
