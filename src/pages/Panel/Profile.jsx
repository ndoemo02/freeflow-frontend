export default function Profile() {
  return (
    <form className="grid gap-4">
      <label className="grid gap-2">
        <span>Imię i nazwisko</span>
        <input className="ff-input" placeholder="Jan Kowalski" />
      </label>
      <label className="grid gap-2">
        <span>E‑mail</span>
        <input type="email" className="ff-input" placeholder="email@domena.com" />
      </label>
      <label className="grid gap-2">
        <span>Telefon</span>
        <input className="ff-input" placeholder="+48..." />
      </label>
      <button type="button" className="ff-btn ff-btn--primary w-fit">Zapisz</button>
    </form>
  );
}


