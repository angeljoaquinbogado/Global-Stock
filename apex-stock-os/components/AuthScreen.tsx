            .from("global_stock_profiles")
            .upsert(
              {
                user_id: data.user.id,
                full_name:
                  typeof metadata.full_name === "string"
                    ? metadata.full_name
                    : null,
                business_name:
                  typeof metadata.business_name === "string"
                    ? metadata.business_name
                    : null,
                industry:
                  typeof metadata.industry === "string"
                    ? metadata.industry
                    : null,
                country:
                  typeof metadata.country === "string"
                    ? metadata.country
                    : null,
                business_description:
                  typeof metadata.business_description === "string"
                    ? metadata.business_description
                    : null,
                default_currency: currency,
                language
              },
              { onConflict: "user_id", ignoreDuplicates: true }
            );

          if (profileError) throw profileError;
        }

        onAuthenticated();
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            app: "global_stock",
            full_name: name.trim(),
            business_name: businessName.trim(),
            industry,
            country: country.trim(),
            business_description: businessDescription.trim(),
            default_currency: currency,
            language
          }
        }
      });

      if (authError) throw authError;

      persistBusinessProfile();

      if (data.session) {
        onAuthenticated();
      } else {
        setMode("signin");
        setError(labels.accountCreated);
      }
    } catch {
      setError(labels.authError);
    } finally {
      setPending(false);
    }
  }

  async function signInWithGoogle() {
    setError("");
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setError(labels.oauthSetup);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });

    if (authError) setError(labels.authError);
  }

  const surfaceClass = dark
    ? "border-white/12 bg-black/[0.78] text-white shadow-[0_38px_120px_rgba(0,0,0,.62)]"
    : "border-black/10 bg-white/[0.96] text-[#111114] shadow-[0_32px_90px_rgba(0,0,0,.26)]";

  const mutedClass = dark ? "text-white/65" : "text-[#5F6068]";
  const fieldClass = dark
    ? "border-white/12 bg-white/[0.07] text-white placeholder:text-white/35 focus:bg-white/[0.10]"
    : "border-black/12 bg-white text-[#111114] placeholder:text-[#8A8B91] shadow-[0_1px_0_rgba(0,0,0,.03)] focus:bg-white";
  const iconMutedClass = dark ? "text-white/48" : "text-[#6E7078]";

  return (
    <main className="relative h-[100dvh] min-h-[100svh] overflow-hidden bg-black">
      <AuthScene active={!introComplete} panelVisible={introComplete} />

      <AnimatePresence mode="wait">
        {!introComplete ? (
          <motion.section
            key="brand-intro"
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6 text-white"
            exit={{ opacity: 0, transform: "scale(1.02)" }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
          >
            <AnimatePresence>
              {brandVisible && (
                <motion.div
                  initial={{
                    opacity: 0,
                    transform: "translate3d(0,16px,0) scale(.95)"
                  }}
                  animate={{
                    opacity: 1,
                    transform: "translate3d(0,0,0) scale(1)"
                  }}