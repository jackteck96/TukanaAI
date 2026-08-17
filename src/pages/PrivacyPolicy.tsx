import { useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Info,
  User,
  FileText,
  Scale,
  Share2,
  Clock,
  Cookie,
  Shield,
  UserCheck,
  Globe,
  Mail,
  RefreshCw,
} from "lucide-react";

// English Privacy Policy. Final, company-approved text (not a translation of
// PoliticaPrivacidade.tsx — the PT page still has unfilled placeholders and a
// different structure). See docs/legal/README.md for background.
const PrivacyPolicy = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Mirror of the redirect in PoliticaPrivacidade.tsx: this page is
  // English-only, so switching the language switcher to Portuguese while
  // here needs to send the user to the Portuguese route, not just leave
  // English text on screen with a Portuguese label in the header.
  useEffect(() => {
    if (!i18n.language.startsWith("en")) {
      navigate("/politica-privacidade", { replace: true });
    }
  }, [i18n.language, navigate]);

  return (
    <>
      <Helmet>
        <title>Privacy Policy | Tukana AI</title>
        <meta
          name="description"
          content="Tukana AI's Privacy Policy, in compliance with Brazil's LGPD. Learn how we collect, use, share, and protect your personal data."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Version 1.0 – Last updated: {new Date().toLocaleDateString("en-US")}
            </p>
          </div>

          <div className="space-y-6">
            {/* Company identification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  TUKANA AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">
                  TUKANA AI LTDA, a limited liability business company (sociedade
                  empresária limitada) enrolled with the Brazilian Corporate
                  Taxpayer Registry (CNPJ) under No. 68.511.834/0001-03, with
                  registered offices at Rua Acelino Grande, No. 110, Casa 03,
                  Condomínio Castel Novara, Santa Felicidade, Curitiba, State of
                  Paraná, Brazil, ZIP Code 82.320-130 (hereinafter "Tukana AI").
                </p>
              </CardContent>
            </Card>

            {/* 1. Introduction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  1. Introduction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tukana AI is committed to protecting the privacy and the
                  personal data of its Users, in compliance with the Brazilian
                  General Data Protection Law (LGPD, Federal Law No.
                  13,709/2018). This Policy describes how we collect, use,
                  store, share and protect your information.
                </p>
              </CardContent>
            </Card>

            {/* 2. Data We Collect */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  2. Data We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Provided by the User:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Name</li>
                    <li>Job title</li>
                    <li>Email address</li>
                    <li>Telephone number</li>
                    <li>Company details (corporate name, CNPJ)</li>
                    <li>
                      Payment data (processed by PCI-DSS compliant partners, as
                      Tukana AI does not store card data)
                    </li>
                    <li>Documents uploaded to the Platform</li>
                    <li>Communications with support</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Collected automatically:</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>IP address</li>
                    <li>Device and browser information</li>
                    <li>Access logs and records of actions on the Platform</li>
                    <li>Aggregated usage data</li>
                    <li>Cookies</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 3. Purposes of Processing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  3. Purposes of Processing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2">We use your data to:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Provide the contracted services</li>
                  <li>Communicate about the service, invoices and support</li>
                  <li>Ensure security and prevent fraud</li>
                  <li>
                    Improve the product on the basis of aggregated and
                    anonymized usage
                  </li>
                  <li>Comply with legal obligations</li>
                  <li>
                    Send marketing communications, only with explicit consent
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 4. Legal Bases for Processing (LGPD) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  4. Legal Bases for Processing (LGPD)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold mb-1">
                    Performance of a contract (article 7, V)
                  </h3>
                  <p className="text-muted-foreground">
                    To provide the contracted services.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold mb-1">
                    Compliance with a legal obligation (article 7, II)
                  </h3>
                  <p className="text-muted-foreground">
                    Where required by law.
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold mb-1">
                    Legitimate interest (article 7, IX)
                  </h3>
                  <p className="text-muted-foreground">
                    Security and improvement of the service.
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold mb-1">
                    Consent (article 7, I)
                  </h3>
                  <p className="text-muted-foreground">
                    For marketing communications.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 5. Data Sharing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  5. Data Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  Tukana AI does not sell, rent or trade personal data. Sharing
                  occurs only with:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>
                    Technology suppliers that support our operations (always
                    under confidentiality and data protection agreements)
                  </li>
                  <li>Public authorities, where required by law</li>
                  <li>Third parties, with the express consent of the User</li>
                </ul>
              </CardContent>
            </Card>

            {/* 6. Data Retention and Deletion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  6. Data Retention and Deletion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold">Account data:</h3>
                  <p className="text-muted-foreground">
                    Retained during the subscription and for up to 5 (five)
                    years after termination.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Uploaded documents:</h3>
                  <p className="text-muted-foreground">
                    As configured by the User, with 30 (thirty) days for
                    export after the account is closed.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Access logs:</h3>
                  <p className="text-muted-foreground">
                    Up to 6 (six) months, in accordance with the Brazilian
                    Internet Civil Framework (Federal Law No. 12,965/2014).
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Billing data:</h3>
                  <p className="text-muted-foreground">
                    In accordance with applicable tax legislation.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 7. Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="h-5 w-5" />
                  7. Cookies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>We use:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>
                    <strong>Essential cookies</strong> (necessary for operation
                    and not subject to deactivation)
                  </li>
                  <li>
                    <strong>Analytics cookies</strong> (aggregated and
                    anonymized usage)
                  </li>
                  <li>
                    <strong>Preference cookies</strong> (User settings)
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Preferences may be managed in the browser settings.
                </p>
              </CardContent>
            </Card>

            {/* 8. Data Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  8. Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>We adopt:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>SSL/TLS encryption in all communications</li>
                  <li>Role-based access control (RBAC)</li>
                  <li>Automatic backups</li>
                  <li>Continuous security monitoring</li>
                  <li>Restricted access to data by the Tukana AI team</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  In the event of an incident, we will notify the data
                  subjects and the Brazilian Data Protection Authority (ANPD)
                  within the statutory time limits.
                </p>
              </CardContent>
            </Card>

            {/* 9. Data Subject Rights (LGPD) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  9. Data Subject Rights (LGPD)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>
                  Upon request sent to{" "}
                  <a
                    href="mailto:tukanaai@gmail.com"
                    className="text-primary hover:underline"
                  >
                    tukanaai@gmail.com
                  </a>
                  , the User may exercise the rights to:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Confirmation of processing and access to data</li>
                  <li>Correction of inaccurate data</li>
                  <li>
                    Anonymization, blocking or deletion of unnecessary data
                  </li>
                  <li>Data portability</li>
                  <li>Deletion of data processed on the basis of consent</li>
                  <li>Withdrawal of consent</li>
                  <li>Information on data sharing</li>
                  <li>Review of automated decisions</li>
                </ul>
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm">
                    Tukana AI will respond within 15 (fifteen) business days.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 10. International Data Transfers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  10. International Data Transfers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Some infrastructure providers may be located outside Brazil.
                  Transfers are carried out only to countries with an adequate
                  level of protection or under contractual instruments
                  equivalent to the LGPD.
                </p>
              </CardContent>
            </Card>

            {/* 11. Data Protection Officer (DPO) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  11. Data Protection Officer (DPO)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground">
                  The officer in charge of personal data processing may be
                  contacted at{" "}
                  <a
                    href="mailto:tukanaai@gmail.com"
                    className="text-primary hover:underline"
                  >
                    tukanaai@gmail.com
                  </a>
                  . This is the official channel for data protection matters
                  and for communications with the ANPD.
                </p>
              </CardContent>
            </Card>

            {/* 12. Amendments to this Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  12. Amendments to this Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This Policy may be updated from time to time. The User will
                  be notified of material changes at least 15 (fifteen) days
                  in advance. The current version will always be available at{" "}
                  <a
                    href="https://fuzen.online/privacy-policy"
                    className="text-primary hover:underline"
                  >
                    fuzen.online/privacy-policy
                  </a>
                  .
                </p>
              </CardContent>
            </Card>

            {/* 13. Contact */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  13. Contact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:tukanaai@gmail.com"
                    className="text-primary hover:underline"
                  >
                    tukanaai@gmail.com
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default PrivacyPolicy;
