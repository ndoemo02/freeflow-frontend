import { useState } from 'react'
import PanelLayout from '../layouts/PanelLayout'
import { toast } from '../state/toast'
import api from '../lib/api'

const emailRe = /[^\s@]+@[^\s@]+\.[^\s@]+/

export default function RegisterBusiness() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', nip: '', note: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }))

  async function onSubmit(e) {
    e.preventDefault()
    setBusy(true); setMsg(''); setErr('')
    // walidacja
    if (!form.name || form.name.trim().length < 2) { setBusy(false); setErr('Nazwa firmy powinna mieć co najmniej 2 znaki.'); return }
    if (!emailRe.test(form.email)) { setBusy(false); setErr('Podaj poprawny adres e‑mail.'); return }
    try {
      await api('/api/business/register', { method: 'POST', body: JSON.stringify(form) })
      setMsg('Zgłoszenie przyjęte. Skontaktujemy się wkrótce.')
      toast.success('Zgłoszenie wysłane ✅')
      setForm({ name: '', email: '', phone: '', city: '', nip: '', note: '' })
    } catch (e) {
      setErr('Nie udało się wysłać. Spróbuj ponownie.')
      toast.error('Nie udało się wysłać zgłoszenia')
    } finally {
      setBusy(false)
    }
  }

  return (
    <PanelLayout title="Rejestracja firmy">
      <form onSubmit={onSubmit} className="ff-card p-4 grid gap-3">
        <label className="grid gap-1" htmlFor="biz-name">Nazwa firmy *</label>
        <input id="biz-name" name="name" autoComplete="organization" className="ff-input" value={form.name} onChange={onChange} />

        <label className="grid gap-1" htmlFor="biz-email">E‑mail *</label>
        <input id="biz-email" type="email" name="email" autoComplete="email" className="ff-input" value={form.email} onChange={onChange} />

        <label className="grid gap-1" htmlFor="biz-phone">Telefon</label>
        <input id="biz-phone" name="phone" autoComplete="tel" className="ff-input" value={form.phone} onChange={onChange} />

        <label className="grid gap-1" htmlFor="biz-city">Miasto</label>
        <input id="biz-city" name="city" autoComplete="address-level2" className="ff-input" value={form.city} onChange={onChange} />

        <label className="grid gap-1" htmlFor="biz-nip">NIP <span className="opacity-70">(opcjonalne)</span></label>
        <input id="biz-nip" name="nip" className="ff-input" value={form.nip} onChange={onChange} placeholder="możesz zostawić puste" />

        <label className="grid gap-1" htmlFor="biz-note">Notatka <span className="opacity-70">(opcjonalne)</span></label>
        <textarea id="biz-note" name="note" className="ff-input" value={form.note} onChange={onChange} style={{ minHeight: 100 }} />

        <div className="flex gap-2 pt-1">
          <button type="submit" className="ff-btn ff-btn--primary" disabled={busy}>{busy ? 'Wysyłanie…' : 'Wyślij zgłoszenie'}</button>
          <button type="button" className="ff-btn ff-btn--secondary" onClick={() => setForm({ name: '', email: '', phone: '', city: '', nip: '', note: '' })}>Wyczyść</button>
        </div>
        {msg && <div className="ff-alert" style={{ marginTop: 8 }}>{msg}</div>}
        {err && <div className="ff-alert" style={{ marginTop: 8, background:'rgba(255,0,0,.10)', border:'1px solid rgba(255,0,0,.35)' }}>{err}</div>}
      </form>
    </PanelLayout>
  )
}
