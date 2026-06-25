import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 max-w-xl mx-auto flex flex-col gap-10">

      {/* Logo + titre */}
      <section className="flex flex-col items-center gap-3 pt-4">
        <div
          className="w-[62px] h-[62px] rounded-[18px] bg-[var(--primary)] flex items-center justify-center text-[34px]"
          style={{ boxShadow: "0 16px 34px -12px rgba(194,96,63,.6)" }}
        >
          🏠
        </div>
        <h1
          className="text-[32px] font-extrabold tracking-[-0.02em] text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          CasaHub
        </h1>
        <p className="text-[15px] text-[var(--text-soft)]">
          Design system ready ✓
        </p>
      </section>

      {/* Boutons */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Buttons</SectionLabel>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Se connecter</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="ghost">Fantôme</Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="sm">Petit</Button>
          <Button variant="primary" size="lg">Grand</Button>
          <Button variant="primary" disabled>Désactivé</Button>
        </div>
      </section>

      {/* Input */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Input</SectionLabel>
        <Input
          label="Nom du foyer"
          placeholder="Ex: Le Foyer"
          id="foyer-name"
        />
        <Input
          label="E-mail"
          placeholder="lea@exemple.fr"
          type="email"
          id="email"
        />
      </section>

      {/* Badges — compteurs univers */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Badges</SectionLabel>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Par défaut</Badge>
          <Badge variant="shopping">3</Badge>
          <Badge variant="tasks">5</Badge>
          <Badge variant="agenda">2</Badge>
          <Badge variant="notes">1</Badge>
          <Badge variant="links">4</Badge>
        </div>
      </section>

      {/* Avatars membres */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Avatars membres</SectionLabel>
        <div className="flex items-center gap-3">
          {/* Léa = terracotta */}
          <Avatar
            initials="L"
            size="lg"
            className="bg-[#C2603F] text-white border-2 border-[var(--background)]"
          />
          {/* Tom = bleu */}
          <Avatar
            initials="T"
            size="lg"
            className="bg-[#6E8BA6] text-white border-2 border-[var(--background)] -ml-2.5"
          />
          <span className="text-[13.5px] font-semibold text-[var(--text-primary)] ml-2">
            Léa &amp; Tom
          </span>
        </div>
      </section>

      {/* Cards */}
      <section className="flex flex-col gap-3">
        <SectionLabel>Cards</SectionLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="bg-[var(--shopping-bg)]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <span className="text-[30px] leading-none">🛒</span>
                <Badge variant="shopping">3</Badge>
              </div>
            </CardHeader>
            <CardTitle className="text-[var(--shopping-text)] text-[20px]">
              Courses
            </CardTitle>
            <CardContent className="text-[var(--primary)] mt-1">
              Lait, pâtes, café…
            </CardContent>
          </Card>

          <Card className="bg-[var(--tasks-bg)]">
            <CardHeader>
              <div className="flex items-start justify-between">
                <span className="text-[30px] leading-none">✅</span>
                <Badge variant="tasks">5</Badge>
              </div>
            </CardHeader>
            <CardTitle className="text-[var(--tasks-text)] text-[20px]">
              Tâches
            </CardTitle>
            <CardContent className="text-[#6E8456] mt-1">
              à faire aujourd&apos;hui
            </CardContent>
          </Card>

          <Card className="bg-[var(--agenda-bg)]">
            <CardHeader>
              <span className="text-[30px] leading-none">📅</span>
            </CardHeader>
            <CardTitle className="text-[var(--agenda-text)] text-[18px]">
              Agenda
            </CardTitle>
            <CardContent className="text-[#5E7790] mt-1">
              Médecin · 14:00
            </CardContent>
          </Card>

          <Card className="bg-[var(--notes-bg)]">
            <CardHeader>
              <span className="text-[30px] leading-none">📝</span>
            </CardHeader>
            <CardTitle className="text-[var(--notes-text)] text-[18px]">
              Notes
            </CardTitle>
            <CardContent className="text-[#8A7536] mt-1">
              WiFi · codes
            </CardContent>
          </Card>
        </div>
      </section>

    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[.05em] text-[var(--text-muted)]">
      {children}
    </p>
  );
}
