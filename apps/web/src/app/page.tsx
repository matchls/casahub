import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/components/ui";

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto flex flex-col gap-10">

      {/* Header */}
      <section className="text-center pt-8">
        <h1
          className="text-5xl font-bold tracking-tight text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          CasaHub
        </h1>
        <p className="mt-2 text-[var(--text-muted)] text-lg">
          Design system ready
        </p>
      </section>

      {/* Buttons */}
      <section className="flex flex-col gap-3">
        <h2
          className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]"
        >
          Buttons
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      {/* Input */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Input
        </h2>
        <div className="max-w-xs">
          <Input label="Foyer name" placeholder="Ex: Casa Verde" id="foyer-name" />
        </div>
      </section>

      {/* Badges */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Badges
        </h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="shopping">Courses</Badge>
          <Badge variant="tasks">Tâches</Badge>
          <Badge variant="agenda">Agenda</Badge>
          <Badge variant="notes">Notes</Badge>
          <Badge variant="links">Liens</Badge>
        </div>
      </section>

      {/* Avatars */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Avatars
        </h2>
        <div className="flex items-end gap-3">
          <Avatar initials="MC" size="sm" />
          <Avatar initials="AL" size="md" />
          <Avatar initials="JD" size="lg" />
        </div>
      </section>

      {/* Cards */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Cards
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Courses</CardTitle>
                <Badge variant="shopping">3 items</Badge>
              </div>
            </CardHeader>
            <CardContent>Pain, lait, œufs…</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tâches</CardTitle>
                <Badge variant="tasks">2 en cours</Badge>
              </div>
            </CardHeader>
            <CardContent>Nettoyer la cuisine, payer le loyer…</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Agenda</CardTitle>
                <Badge variant="agenda">Aujourd&apos;hui</Badge>
              </div>
            </CardHeader>
            <CardContent>Réunion foyer 18h, dîner 20h…</CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notes</CardTitle>
                <Badge variant="notes">1 note</Badge>
              </div>
            </CardHeader>
            <CardContent>Mot de passe WiFi : casa2024…</CardContent>
          </Card>
        </div>
      </section>

    </main>
  );
}
