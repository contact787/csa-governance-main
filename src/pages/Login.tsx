import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Lock, ArrowRight, Shield, CheckCircle2, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const REMEMBER_ME_KEY = "rememberMe";
const REMEMBER_ME_EXPIRY_KEY = "rememberMeExpiry";
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const rememberMeExpiry = localStorage.getItem(REMEMBER_ME_EXPIRY_KEY);
    if (rememberMeExpiry) {
      const expiryDate = new Date(rememberMeExpiry);
      if (expiryDate > new Date()) {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
          if (session) {
            const { data: userRole } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (userRole?.role === "compliance_manager") {
              navigate("/compliance-review");
            } else {
              navigate("/");
            }
          }
        });
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(REMEMBER_ME_EXPIRY_KEY);
      }
    } else {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session) {
          const { data: userRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (userRole?.role === "compliance_manager") {
            navigate("/compliance-review");
          } else {
            navigate("/");
          }
        }
      });
    }
  }, [navigate]);

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      if (error.message === "Invalid login credentials") {
        setPasswordError("Incorrect email or password");
      }
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message === "Invalid login credentials" 
          ? "Incorrect email or password." 
          : error.message,
      });
    } else {
      if (rememberMe) {
        const expiryDate = new Date(Date.now() + NINETY_DAYS_MS);
        localStorage.setItem(REMEMBER_ME_KEY, "true");
        localStorage.setItem(REMEMBER_ME_EXPIRY_KEY, expiryDate.toISOString());
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(REMEMBER_ME_EXPIRY_KEY);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, organization_id, organization:organizations(name)")
            .eq("user_id", user.id)
            .maybeSingle();

          await supabase.from("login_history").insert({
            user_id: user.id,
            user_email: user.email || "",
            user_name: profile?.full_name || null,
            organization_id: profile?.organization_id || null,
            organization_name: profile?.organization?.name || null,
            success: true,
          });
        } catch (logError) {
          console.error("Error logging login:", logError);
        }

        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        
        if (userRole?.role === "compliance_manager") {
          navigate("/compliance-review");
        } else {
          navigate("/");
        }
      }
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      return;
    }

    setResetLoading(true);

    const redirectUrl = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    setResetLoading(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } else {
      toast({
        title: "Email sent",
        description: "Check your inbox for the password reset link.",
      });
      setShowForgotPassword(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Secure & Compliant",
      description: "Enterprise-grade security for your compliance data"
    },
    {
      icon: CheckCircle2,
      title: "Streamlined Workflows",
      description: "Simplify your compliance management process"
    },
    {
      icon: BarChart3,
      title: "Real-time Insights",
      description: "Track and monitor your organization's progress"
    }
  ];

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-primary-foreground">
            <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              CSBG Standards<br />Compliance OS
            </h1>
            <p className="text-lg xl:text-xl opacity-90 mb-12 max-w-md">
              Your trusted platform for managing organizational compliance with confidence.
            </p>
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4 animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{feature.title}</h3>
                    <p className="text-sm opacity-80">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Reset Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md space-y-8 animate-fade-in">
            <div className="text-center lg:text-left">
              <div className="lg:hidden mb-8">
                <h2 className="text-2xl font-bold text-primary">CSBG Standards</h2>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Reset Password</h1>
              <p className="text-muted-foreground">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className={cn(
                    "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
                    emailFocused ? "text-primary" : "text-muted-foreground"
                  )} />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    disabled={resetLoading}
                    className={cn(
                      "pl-11 h-12 text-base transition-all duration-200",
                      emailError && "border-destructive focus-visible:ring-destructive"
                    )}
                    required
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-destructive animate-fade-in">{emailError}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" 
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full h-12 text-base"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Sign In
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-primary-foreground">
          <h1 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
            CSBG Standards<br />Compliance OS
          </h1>
          <p className="text-lg xl:text-xl opacity-90 mb-12 max-w-md">
            Your trusted platform for managing organizational compliance with confidence.
          </p>
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="flex items-start gap-4 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm opacity-80">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center lg:text-left">
            <div className="lg:hidden mb-8">
              <h2 className="text-2xl font-bold text-primary">CSBG Standards</h2>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
                  emailFocused ? "text-primary" : "text-muted-foreground"
                )} />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  disabled={loading}
                  className={cn(
                    "pl-11 h-12 text-base transition-all duration-200",
                    emailError && "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>
              {emailError && (
                <p className="text-sm text-destructive animate-fade-in">{emailError}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
                  passwordFocused ? "text-primary" : "text-muted-foreground"
                )} />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) validatePassword(e.target.value);
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  disabled={loading}
                  className={cn(
                    "pl-11 h-12 text-base transition-all duration-200",
                    passwordError && "border-destructive focus-visible:ring-destructive"
                  )}
                />
              </div>
              {passwordError && (
                <p className="text-sm text-destructive animate-fade-in">{passwordError}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-3">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={loading}
                className="h-5 w-5 rounded border-2 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-normal cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                Remember me for 90 days
              </Label>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Sign up link */}
          <div className="text-center pt-4">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Trust Badge */}
          <div className="flex items-center justify-center gap-2 pt-6 border-t border-border">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Protected by enterprise-grade security
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
