import { useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Bell, CreditCard, LayoutDashboard, Menu, Plus, ShieldCheck, Wallet, X } from "lucide-react";

const activities = [
  { title: "Wallet funding request", date: "Today · Pending provider setup", amount: "+ ₦25,000.00", kind: "pending" },
  { title: "Internal transfer", date: "Yesterday · Demo activity", amount: "− ₦4,500.00", kind: "sent" },
  { title: "Wallet funding request", date: "Oct 21 · Demo activity", amount: "+ ₦10,000.00", kind: "received" }
];

export default function App() {
  const [modal, setModal] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const open = (name: string) => setModal(name);
  const submit = () => { setNotice("Demo only: request was not sent and no money moved."); setModal(""); window.setTimeout(() => setNotice(""), 4500); };
  return <div className="shell">
    <aside className={menuOpen ? "sidebar show" : "sidebar"}>
      <div className="brand"><span className="brand-mark">W</span><span>WalletBox<small>YOUR MONEY, IN VIEW</small></span><button className="close-menu" onClick={() => setMenuOpen(false)}><X size={18}/></button></div>
      <div className="nav-label">WORKSPACE</div>
      <a className="nav active"><LayoutDashboard size={18}/> Overview</a><a className="nav" onClick={() => open("Wallets")}><Wallet size={18}/> My wallets</a><a className="nav" onClick={() => open("Transfers")}><ArrowLeftRight size={18}/> Transfers</a><a className="nav" onClick={() => open("Cards")}><CreditCard size={18}/> Cards</a>
      <div className="sidebar-bottom"><div className="security"><ShieldCheck size={20}/><div><b>Security first</b><small>Providers are disconnected</small></div></div><div className="profile"><div className="avatar">WB</div><div><b>WalletBox demo</b><small>Starter workspace</small></div></div></div>
    </aside>
    <main className="main">
      <header><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}><Menu/></button><div><span className="eyebrow">PERSONAL FINANCE</span><h1>Overview</h1></div><button className="icon-button" onClick={() => setNotice("You’re all caught up.")}><Bell size={19}/></button></header>
      <div className="banner"><div><b>Welcome to WalletBox</b><p>This is a development preview. Financial providers are not connected.</p></div><span className="status-dot">DEMO MODE</span></div>
      <section className="balance-card"><div className="balance-top"><span>Total wallet balance</span><span className="balance-icon"><Wallet size={20}/></span></div><h2>₦ 0.00</h2><p>Live balance will appear when a verified provider and ledger are configured.</p><div className="actions"><button className="primary" onClick={() => open("Add money")}><Plus size={17}/> Add money</button><button className="light" onClick={() => open("Send money")}><ArrowUpRight size={17}/> Send</button><button className="light" onClick={() => open("Convert")}><ArrowLeftRight size={17}/> Convert</button></div></section>
      <section className="stats"><div className="stat"><span>Available balance</span><b>₦0.00</b><small>Provider not connected</small></div><div className="stat"><span>Pending requests</span><b>0</b><small>Requests only; no funds moved</small></div><div className="stat"><span>Wallet currencies</span><b>5</b><small>Some assets disabled</small></div></section>
      <section className="content-grid"><div className="panel"><div className="panel-head"><div><h3>Recent activity</h3><p>Your latest wallet events</p></div><button className="text-button" onClick={() => open("Activity")}>View all</button></div>{activities.map((a) => <div className="activity" key={a.title+a.date}><div className={"activity-icon "+a.kind}>{a.kind === "received" ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}</div><div className="activity-copy"><b>{a.title}</b><small>{a.date}</small></div><strong className={a.kind === "received" ? "positive" : ""}>{a.amount}</strong></div>)}<p className="disclaimer">Illustrative examples only — not actual account activity.</p></div><div className="panel quick"><h3>Quick actions</h3><p>Choose a task to start a demo request.</p><button onClick={() => open("Deposit request")}><span><ArrowDownLeft/></span><div><b>Add money</b><small>Record a deposit request</small></div><ArrowUpRight size={16}/></button><button onClick={() => open("Withdrawal request")}><span><ArrowUpRight/></span><div><b>Withdraw</b><small>Provider connection required</small></div><ArrowUpRight size={16}/></button><button onClick={() => open("Payment methods")}><span><CreditCard/></span><div><b>Payment methods</b><small>Configure after launch setup</small></div><ArrowUpRight size={16}/></button></div></section>
      <footer>© 2026 WalletBox <span>Secure by design · Integrations pending</span></footer>
    </main>
    {modal && <div className="modal-backdrop" onClick={() => setModal("")}><div className="modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setModal("")}><X size={18}/></button><div className="modal-symbol"><Wallet/></div><h2>{modal}</h2><p>WalletBox is running in demo mode. No provider is connected and no money will move.</p><label>Amount (NGN)</label><input type="number" min="100" placeholder="Enter amount (optional)"/><label>Note / destination</label><input placeholder="Optional note"/><button className="primary full" onClick={submit}>Preview request</button><small className="modal-note">This only displays a demo notice; it does not create a live financial transaction.</small></div></div>}
    {notice && <div className="toast">{notice}</div>}
  </div>;
}