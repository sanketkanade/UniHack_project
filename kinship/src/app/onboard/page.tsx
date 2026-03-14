"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKinshipStore } from "@/lib/store";
import { loadAuthFromOffline, saveAuthToOffline } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { AddressAutocomplete } from "@/components/ui/AddressAutocomplete";
import { ArrowLeft, ArrowRight, Check, Lock, Sparkles, MapPin } from "lucide-react";
import { getCategoryIcon } from "@/lib/utils";
import toast from "react-hot-toast";

// Suburb → approximate center coordinates for Melbourne suburbs
const SUBURB_COORDS: Record<string, { lat: number; lng: number }> = {
  footscray: { lat: -37.7996, lng: 144.8994 },
  seddon: { lat: -37.8065, lng: 144.8913 },
  yarraville: { lat: -37.8165, lng: 144.8938 },
  maribyrnong: { lat: -37.7746, lng: 144.8884 },
  maidstone: { lat: -37.7745, lng: 144.8725 },
  "west footscray": { lat: -37.7975, lng: 144.8775 },
  braybrook: { lat: -37.7905, lng: 144.8575 },
  sunshine: { lat: -37.7880, lng: 144.8325 },
  "st albans": { lat: -37.7435, lng: 144.8003 },
  melbourne: { lat: -37.8136, lng: 144.9631 },
  "melbourne cbd": { lat: -37.8136, lng: 144.9631 },
  fitzroy: { lat: -37.7984, lng: 144.9780 },
  richmond: { lat: -37.8183, lng: 144.9987 },
  carlton: { lat: -37.7943, lng: 144.9671 },
  brunswick: { lat: -37.7668, lng: 144.9601 },
  collingwood: { lat: -37.8023, lng: 144.9876 },
  "south yarra": { lat: -37.8381, lng: 144.9929 },
  prahran: { lat: -37.8511, lng: 144.9919 },
  "st kilda": { lat: -37.8674, lng: 144.9808 },
  northcote: { lat: -37.7693, lng: 144.9995 },
  thornbury: { lat: -37.7546, lng: 144.9978 },
  preston: { lat: -37.7433, lng: 144.9958 },
  coburg: { lat: -37.7435, lng: 144.9644 },
  ascot: { lat: -37.7720, lng: 144.9130 },
  flemington: { lat: -37.7879, lng: 144.9291 },
  kensington: { lat: -37.7935, lng: 144.9270 },
  "port melbourne": { lat: -37.8375, lng: 144.9352 },
  williamstown: { lat: -37.8614, lng: 144.8988 },
  altona: { lat: -37.8670, lng: 144.8317 },
  newport: { lat: -37.8429, lng: 144.8826 },
  spotswood: { lat: -37.8315, lng: 144.8870 },
  hawthorn: { lat: -37.8226, lng: 145.0342 },
  camberwell: { lat: -37.8431, lng: 145.0700 },
  box: { lat: -37.8193, lng: 145.1266 },
  doncaster: { lat: -37.7850, lng: 145.1264 },
  heidelberg: { lat: -37.7567, lng: 145.0679 },
  ivanhoe: { lat: -37.7694, lng: 145.0454 },
  "moorabbin": { lat: -37.9284, lng: 145.0594 },
  "bentleigh": { lat: -37.9167, lng: 145.0333 },
  "cheltenham": { lat: -37.9500, lng: 145.0667 },
  "highett": { lat: -37.9333, lng: 145.0500 },
  "sandringham": { lat: -37.9500, lng: 145.0000 },
  "elsternwick": { lat: -37.8833, lng: 145.0000 },
  "glen waverley": { lat: -37.8772, lng: 145.1635 },
  "clayton": { lat: -37.9167, lng: 145.1167 },
  "oakleigh": { lat: -37.8997, lng: 145.0876 },
  "caulfield": { lat: -37.8767, lng: 145.0231 },
  "dandenong": { lat: -37.9878, lng: 145.2150 },
  "frankston": { lat: -38.1440, lng: 145.1210 },
  "ringwood": { lat: -37.8150, lng: 145.2270 },
  "box hill": { lat: -37.8193, lng: 145.1266 },
  "glen iris": { lat: -37.8660, lng: 145.0500 },
  "malvern": { lat: -37.8667, lng: 145.0167 },
  "toorak": { lat: -37.8444, lng: 145.0167 },
  "armadale": { lat: -37.8560, lng: 145.0167 },
  "windsor": { lat: -37.8570, lng: 144.9920 },
  "elwood": { lat: -37.8830, lng: 144.9870 },
  "middle park": { lat: -37.8500, lng: 144.9600 },
  "albert park": { lat: -37.8400, lng: 144.9570 },
  "south melbourne": { lat: -37.8330, lng: 144.9620 },
  "docklands": { lat: -37.8150, lng: 144.9450 },
  "north melbourne": { lat: -37.8000, lng: 144.9490 },
  "west melbourne": { lat: -37.8050, lng: 144.9410 },
  "essendon": { lat: -37.7490, lng: 144.9200 },
  "moonee ponds": { lat: -37.7650, lng: 144.9200 },
  "pascoe vale": { lat: -37.7283, lng: 144.9445 },
  "glenroy": { lat: -37.7050, lng: 144.9320 },
  "reservoir": { lat: -37.7194, lng: 145.0119 },
  "templestowe": { lat: -37.7538, lng: 145.1461 },
  "greensborough": { lat: -37.7053, lng: 145.1042 },
  "bundoora": { lat: -37.7017, lng: 145.0631 },
  "epping": { lat: -37.6456, lng: 145.0133 },
  "croydon": { lat: -37.7950, lng: 145.2810 },
  "boronia": { lat: -37.8617, lng: 145.2856 },
  "ferntree gully": { lat: -37.8798, lng: 145.2939 },
  "knoxfield": { lat: -37.8800, lng: 145.2300 },
  "bayswater": { lat: -37.8453, lng: 145.2680 },
  "wantirna": { lat: -37.8467, lng: 145.2317 },
  "mitcham": { lat: -37.8150, lng: 145.1990 },
  "vermont": { lat: -37.8395, lng: 145.1900 },
  "nunawading": { lat: -37.8181, lng: 145.1782 },
  "blackburn": { lat: -37.8186, lng: 145.1510 },
  "forest hill": { lat: -37.8370, lng: 145.1720 },
  "mount waverley": { lat: -37.8765, lng: 145.1313 },
  "chadstone": { lat: -37.8869, lng: 145.0876 },
  "huntingdale": { lat: -37.9000, lng: 145.0933 },
  "murrumbeena": { lat: -37.9015, lng: 145.0580 },
  "carnegie": { lat: -37.8950, lng: 145.0550 },
  "glen huntly": { lat: -37.8930, lng: 145.0450 },
  "ormond": { lat: -37.9000, lng: 145.0320 },
  "mckinnon": { lat: -37.9117, lng: 145.0433 },
  "bentleigh east": { lat: -37.9317, lng: 145.0533 },
  "heatherton": { lat: -37.9500, lng: 145.0833 },
  "braeside": { lat: -37.9667, lng: 145.0833 },
  "dingley village": { lat: -37.9833, lng: 145.1167 },
  "springvale": { lat: -37.9500, lng: 145.1500 },
  "noble park": { lat: -37.9667, lng: 145.1667 },
  "keysborough": { lat: -37.9967, lng: 145.1733 },
  "patterson lakes": { lat: -38.0350, lng: 145.1150 },
  "carrum": { lat: -38.0667, lng: 145.1167 },
  "seaford": { lat: -38.1000, lng: 145.1333 },
  "chelsea": { lat: -38.0500, lng: 145.1167 },
  "mentone": { lat: -37.9833, lng: 145.0667 },
  "parkdale": { lat: -37.9833, lng: 145.0500 },
  "mordialloc": { lat: -37.9967, lng: 145.0833 },
  "aspendale": { lat: -38.0167, lng: 145.1000 },
  "edithvale": { lat: -38.0333, lng: 145.1000 },
  "bonbeach": { lat: -38.0500, lng: 145.1167 },
};

const LANGUAGES = [
  "English", "Vietnamese", "Mandarin", "Hindi", "Arabic", "Somali",
  "Amharic", "Greek", "Italian", "Tamil", "Auslan", "French", "Spanish", "Other",
];

const CAPABILITY_OPTIONS = [
  { key: "vehicle", icon: "🚗", label: "Vehicle (car, ute, van)" },
  { key: "first_aid", icon: "🩺", label: "First Aid Training" },
  { key: "generator", icon: "⚡", label: "Generator / Solar / Battery" },
  { key: "spare_room", icon: "🏠", label: "Spare Room / Bed" },
  { key: "translation", icon: "🗣️", label: "Language Translation" },
  { key: "cooking", icon: "🍳", label: "Cook for Groups" },
  { key: "it_skills", icon: "💻", label: "IT / Tech Skills" },
  { key: "tools", icon: "🔧", label: "Tools / Equipment" },
  { key: "pet_care", icon: "🐕", label: "Can Mind Pets" },
  { key: "childcare", icon: "👶", label: "Childcare Experience" },
  { key: "radio", icon: "📻", label: "Radio / Comms" },
  { key: "physical", icon: "💪", label: "Physical Labour" },
];

const NEED_OPTIONS = [
  { key: "transport", icon: "🚗", label: "Transport / Evacuation" },
  { key: "medical", icon: "🩺", label: "Medical Support" },
  { key: "language", icon: "🗣️", label: "Language Help" },
  { key: "shelter", icon: "🏠", label: "Shelter" },
  { key: "power", icon: "⚡", label: "Power for Devices" },
  { key: "communication", icon: "📱", label: "Communication Help" },
  { key: "pet_care", icon: "🐕", label: "Pet Care During Evacuation" },
  { key: "mobility", icon: "♿", label: "Mobility Assistance" },
  { key: "childcare", icon: "👶", label: "Childcare" },
  { key: "elderly", icon: "👴", label: "Elderly Check-ins" },
  { key: "vision_hearing", icon: "👁️", label: "Vision / Hearing Support" },
];

export default function OnboardPage() {
  const router = useRouter();
  const {
    currentUser, token, setCurrentUser, setCapabilities, setNeeds,
    setCluster, setOnboardingStep, onboardingStep,
  } = useKinshipStore();

  const [step, setStep] = useState(onboardingStep);
  const [authChecked, setAuthChecked] = useState(false);

  // Step 1 state
  const [name, setName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [approxLocation, setApproxLocation] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [householdSize, setHouseholdSize] = useState(1);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["English"]);
  const [geoLocation, setGeoLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("");

  // Step 2 state (Contact Details)
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappSame, setWhatsappSame] = useState(false);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [preferredMethod, setPreferredMethod] = useState<"SMS" | "WhatsApp" | "Call" | "App">("App");
  const [telegram, setTelegram] = useState("");

  // Step 3 state (Capabilities)
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
  const [capFreeText, setCapFreeText] = useState("");

  // Step 4 state (Needs)
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [needFreeText, setNeedFreeText] = useState("");

  // Loading/confirmation state
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [parsedCaps, setParsedCaps] = useState<Array<{ tag: string; category: string; detail?: string }>>([]);
  const [parsedNeeds, setParsedNeeds] = useState<Array<{ tag: string; category: string; priority?: number }>>([]);

  // Check auth + onboarding status on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check Dexie for existing auth
      const stored = await loadAuthFromOffline();

      if (!stored?.token && !token) {
        // No auth at all — go to login
        router.replace("/");
        return;
      }

      // If onboarding already complete, skip straight to dashboard
      if (stored?.onboarding_complete) {
        router.replace("/dashboard");
        return;
      }

      // Pre-fill name from currentUser if available
      if (currentUser?.name) setName(currentUser.name);

      setAuthChecked(true);
    };

    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Try to get browser geolocation on mount
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLocationStatus("📍 Using your actual location");
        },
        () => {
          setLocationStatus("📍 Using suburb center");
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Get coordinates — prefer Nominatim result, then GPS, then suburb lookup, then default
  const getUserCoords = () => {
    if (lat !== null && lng !== null) {
      // Slightly offset for privacy (~50m radius)
      return {
        lat: lat + (Math.random() - 0.5) * 0.0009,
        lng: lng + (Math.random() - 0.5) * 0.0009,
      };
    }
    if (geoLocation) return geoLocation;
    const suburbKey = suburb.toLowerCase().trim();
    if (SUBURB_COORDS[suburbKey]) {
      const base = SUBURB_COORDS[suburbKey];
      return {
        lat: base.lat + (Math.random() - 0.5) * 0.005,
        lng: base.lng + (Math.random() - 0.5) * 0.005,
      };
    }
    return {
      lat: -37.8136 + (Math.random() - 0.5) * 0.005,
      lng: 144.9631 + (Math.random() - 0.5) * 0.005,
    };
  };

  const toggleLang = (lang: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const toggleCap = (key: string) => {
    setSelectedCaps((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleNeed = (key: string) => {
    setSelectedNeeds((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("Please enter your name"); return; }

    const authToken = token || (await loadAuthFromOffline())?.token;
    const userId = currentUser?.id || (await loadAuthFromOffline())?.user_id;

    if (!authToken || !userId) {
      toast.error("Session expired. Please sign in again.");
      router.replace("/");
      return;
    }

    setLoading(true);

    try {
      const coords = getUserCoords();

      // 1. POST to /api/users/{id}/onboarding — save all form data + set onboarding_complete=true
      const onboardRes = await fetch(`/api/users/${userId}/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          suburb,
          postcode,
          lat: coords.lat,
          lng: coords.lng,
          approximate_location: approxLocation,
          household_size: householdSize,
          languages: selectedLanguages,
          phone: phone,
          whatsapp: whatsappSame ? phone : whatsapp,
          emergency_contact_name: emergencyName,
          emergency_contact_phone: emergencyPhone,
          preferred_contact_method: preferredMethod,
          telegram_username: telegram,
          raw_capabilities_text: capFreeText,
          raw_needs_text: needFreeText,
        }),
      });

      const onboardData = await onboardRes.json();
      if (!onboardRes.ok) {
        toast.error(onboardData.error || "Failed to save profile");
        setLoading(false);
        return;
      }

      setCurrentUser(onboardData.profile);

      // 2. POST to /api/users/{id}/parse — Claude NLP on free text + checkboxes → structured tags
      const parseRes = await fetch(`/api/users/${userId}/parse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          raw_capabilities_text: capFreeText,
          raw_needs_text: needFreeText,
          checkbox_capabilities: selectedCaps,
          checkbox_needs: selectedNeeds,
        }),
      });

      const parsed = await parseRes.json();
      if (parseRes.ok) {
        setCapabilities(parsed.capabilities || []);
        setNeeds(parsed.needs || []);
        setParsedCaps(parsed.capabilities || []);
        setParsedNeeds(parsed.needs || []);
      }

      // 3. POST /api/clusters to generate/join cluster for this user's suburb
      try {
        await fetch(`/api/clusters`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`,
          },
          body: JSON.stringify({ suburb, postcode }),
        });
      } catch (err) {
        console.error("Cluster generation failed:", err);
      }

      const clusterRes = await fetch(`/api/clusters?user_id=${userId}`, {
        headers: { "Authorization": `Bearer ${authToken}` },
      });
      const clusterData = await clusterRes.json();
      if (clusterData && !clusterData.error) {
        setCluster(clusterData);
      }

      // 4. Update Dexie myProfile with onboarding_complete=true
      await saveAuthToOffline({
        user_id: userId,
        token: authToken,
        email: currentUser?.email || "",
        profile: onboardData.profile,
        onboarding_complete: true,
      });

      setShowConfirmation(true);
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const goToStep = (s: number) => {
    setStep(s);
    setOnboardingStep(s);
  };

  // Don't render until auth check is complete
  if (!authChecked) return <LoadingScreen />;
  if (loading) return <LoadingScreen />;

  // Confirmation screen — user reviews parsed tags, then goes to dashboard
  if (showConfirmation) {
    return (
      <main className="min-h-screen bg-warmWhite p-4 flex items-center justify-center">
        <div className="max-w-lg w-full space-y-6 animate-fade-slide-up">
          <div className="text-center">
            <Sparkles className="mx-auto text-accent mb-3" size={40} />
            <h2 className="text-2xl font-bold text-textDark mb-2">We understood this about you</h2>
            <p className="text-textMuted">Look right?</p>
          </div>

          <Card>
            <h3 className="font-semibold text-textDark mb-2">What you can offer</h3>
            <div className="flex flex-wrap gap-2">
              {parsedCaps.map((c, i) => (
                <Badge key={i} variant="success">
                  {getCategoryIcon(c.category)} {c.tag.replace(/_/g, " ")}
                </Badge>
              ))}
              {parsedCaps.length === 0 && <p className="text-sm text-textMuted">No capabilities detected</p>}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-textDark mb-2">What you might need</h3>
            <div className="flex flex-wrap gap-2">
              {parsedNeeds.map((n, i) => (
                <Badge key={i} variant={n.priority === 1 ? "danger" : n.priority === 2 ? "accent" : "muted"}>
                  {n.tag.replace(/_/g, " ")}
                  {n.priority === 1 && " (critical)"}
                  {n.priority === 2 && " (important)"}
                </Badge>
              ))}
              {parsedNeeds.length === 0 && <p className="text-sm text-textMuted">No needs detected</p>}
            </div>
          </Card>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowConfirmation(false)} className="flex-1">
              Edit
            </Button>
            <Button variant="primary" onClick={() => router.push("/dashboard")} className="flex-1">
              Looks Good →
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-warmWhite p-4">
      <div className="max-w-lg mx-auto pt-8">
        {/* Progress Bar & Dots */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-textMuted uppercase tracking-wider">
              Step {step} of 3
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                  s === step ? "bg-accent" : s < step ? "bg-success" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: About You */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-slide-up">
            <h2 className="text-2xl font-bold text-textDark">Tell us about yourself</h2>

            <div>
              <label className="block text-sm font-medium text-textDark mb-1">Display name</label>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="First name or nickname"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-textDark mb-1">Suburb</label>
                <input
                  type="text" value={suburb} onChange={(e) => setSuburb(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                />
                <label className="block text-sm font-medium text-textDark mb-1">
                  Suburb
                </label>
                <input
                  type="text"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1">
                  Postcode
                </label>
                <input
                  type="text"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-1">
                Search your address
              </label>
              <AddressAutocomplete
                value={approxLocation}
                onChange={setApproxLocation}
                onSelect={({ suburb: s, postcode: p, lat: lt, lng: lg }) => {
                  if (s) setSuburb(s);
                  if (p) setPostcode(p);
                  setLat(lt);
                  setLng(lg);
                }}
                placeholder="e.g., 12 Barkly St, Footscray"
              />
              <p className="mt-1.5 text-xs text-textMuted flex items-center gap-1">
                <Lock size={11} /> Only suburb, postcode &amp; approximate
                location are saved — never your exact address
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-1">
                Household size
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={householdSize}
                onChange={(e) => setHouseholdSize(parseInt(e.target.value) || 1)}
                className="w-24 rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Languages spoken
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => toggleLang(lang)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedLanguages.includes(lang)
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-textMuted hover:bg-gray-200"
                    }`}
                  >
                    {selectedLanguages.includes(lang) && (
                      <Check size={14} className="inline mr-1" />
                    )}
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {locationStatus && (
              <p className="text-sm text-textMuted flex items-center gap-1.5">
                <MapPin size={14} /> {locationStatus}
              </p>
            )}

            <p className="text-sm text-textMuted flex items-center gap-1.5">
              <Lock size={14} /> We never store your exact address
            </p>

            <Button
              onClick={() => goToStep(2)}
              className="w-full"
              disabled={!name.trim()}
            >
              Next <ArrowRight size={18} />
            </Button>
          </div>
        )}

        {/* Step 2: Contact Details */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-slide-up">
            <h2 className="text-2xl font-bold text-textDark">
              How should your cluster reach you in a crisis?
            </h2>

            <div>
              <label className="block text-sm font-medium text-textDark mb-1">
                Mobile Number <span className="text-danger">*</span>
              </label>
              <input
                type="tel"
                placeholder="+61 4XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
              />
            </div>

            <div className="p-4 border rounded-xl bg-gray-50/50 space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-textDark cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappSame}
                  onChange={(e) => {
                    setWhatsappSame(e.target.checked);
                    if (e.target.checked) setWhatsapp("");
                  }}
                  className="rounded text-accent focus:ring-accent accent-accent w-4 h-4 cursor-pointer"
                />
                WhatsApp is the same as my mobile
              </label>

              {!whatsappSame && (
                <div>
                  <label className="block text-sm font-medium text-textDark mb-1">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+61 4XX XXX XXX"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-textDark mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  placeholder="Someone outside household"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textDark mb-1">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+61 XXX XXX XXX"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-2">
                Preferred contact method in crisis{" "}
                <span className="text-danger">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {(["SMS", "WhatsApp", "Call", "App"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPreferredMethod(method)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                      preferredMethod === method
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-textDark border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {preferredMethod === method && (
                      <Check size={14} className="inline mr-1" />
                    )}
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-1">
                Telegram username (optional)
              </label>
              <input
                type="text"
                placeholder="@username"
                value={telegram}
                onChange={(e) =>
                  setTelegram(
                    e.target.value.startsWith("@")
                      ? e.target.value
                      : e.target.value
                      ? `@${e.target.value}`
                      : ""
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none"
              />
            </div>

            <p className="text-xs text-textMuted flex items-start gap-1.5 mt-2">
              <Lock size={12} className="mt-0.5 shrink-0" />
              Your contact details are only shared with your matched cluster
              members. Never shown publicly.
            </p>

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => goToStep(1)} className="px-6">
                Back
              </Button>
              <Button
                onClick={() => {
                  const phoneRegex = /^(?:\+61|0)[2-478](?:[ -]?[0-9]){8}$/;
                  if (!phone.trim()) {
                    toast.error("Please provide a mobile number");
                    return;
                  }
                  if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
                    toast.error("Please enter a valid Australian mobile number");
                    return;
                  }
                  goToStep(3);
                }}
                className="flex-1"
              >
                Next <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Capabilities */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-slide-up">
            <h2 className="text-2xl font-bold text-textDark">
              What can you offer in an emergency?
            </h2>
            <p className="text-textMuted">
              Don&apos;t worry — you probably have more to offer than you think.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {CAPABILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => toggleCap(opt.key)}
                  className={`p-3 rounded-xl border text-left transition-all text-sm ${
                    selectedCaps.includes(opt.key)
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <p className="font-medium text-textDark mt-1">
                    {opt.label}
                  </p>
                  {selectedCaps.includes(opt.key) && (
                    <Check size={16} className="text-primary mt-1" />
                  )}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-1">
                Tell us more (optional)
              </label>
              <textarea
                value={capFreeText}
                onChange={(e) => setCapFreeText(e.target.value)}
                placeholder="e.g., I have a ute that fits 5 people, I'm a trained paramedic, I have a large water tank..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => goToStep(2)}>
                <ArrowLeft size={18} /> Back
              </Button>
              <Button onClick={() => goToStep(4)} className="flex-1">
                Next <ArrowRight size={18} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Needs */}
        {step === 4 && (
          <div className="space-y-5 animate-fade-slide-up">
            <h2 className="text-2xl font-bold text-textDark">
              What might you need help with?
            </h2>
            <p className="text-textMuted">
              There&apos;s no shame in needing help. That&apos;s what neighbours
              are for.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {NEED_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => toggleNeed(opt.key)}
                  className={`p-3 rounded-xl border text-left transition-all text-sm ${
                    selectedNeeds.includes(opt.key)
                      ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <p className="font-medium text-textDark mt-1">
                    {opt.label}
                  </p>
                  {selectedNeeds.includes(opt.key) && (
                    <Check size={16} className="text-accent mt-1" />
                  )}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-textDark mb-1">
                Anything else we should know? (optional)
              </label>
              <textarea
                value={needFreeText}
                onChange={(e) => setNeedFreeText(e.target.value)}
                placeholder="e.g., My mother lives with me, she's 82 and uses a wheelchair. She only speaks Vietnamese..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all outline-none resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => goToStep(3)}
                className="px-6"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="accent"
                onClick={handleSubmit}
                className="flex-1"
                disabled={loading}
              >
                <Sparkles size={18} /> Find My Cluster
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
