---
import Layout from '../../components/Layout.astro';
import GlassCard from '../../components/GlassCard.astro';
import { requireAdminSession } from '../../lib/admin-auth';

// Redirection directe côté serveur si l'utilisateur n'est pas connecté
if (!requireAdminSession(Astro)) {
  return Astro.redirect('/admin');
}
---

<Layout title="Résultats du Bal - CPEG Ste Bakhita">
  <div class="header-actions" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
    <h1>Résultats du Bal 2026</h1>
    <a href="/admin" class="btn-secondary">Retour Admin</a>
  </div>

  <div id="results-container">
    <div class="text-center" style="margin-bottom: 2rem;">
      <h2 style="font-size: 2rem; color: var(--gold, #D4AF37);">Tableau de Bord Officiel</h2>
      <p id="total-votes">Chargement des données...</p>
      <button id="refresh-btn" class="btn-refresh">Rafraîchir les résultats</button>
    </div>

    <GlassCard>
      <h3>Votes enregistrés</h3>
      <div id="votes-list">
        <p>Les données sont prêtes à être alimentées depuis la base Supabase.</p>
      </div>
    </GlassCard>
  </div>
</Layout>

<script is:inline>
  document.addEventListener('DOMContentLoaded', () => {
    const totalVotesEl = document.getElementById('total-votes');

    const fetchResults = async () => {
      try {
        const res = await fetch('/api/results');
        if (res.ok) {
          const data = await res.json();
          totalVotesEl.textContent = `Total des bulletins : ${data.total || 0}`;
        } else if (res.status === 401) {
          window.location.href = '/admin';
        }
      } catch (err) {
        totalVotesEl.textContent = "Erreur lors du chargement des résultats.";
      }
    };

    document.getElementById('refresh-btn')?.addEventListener('click', fetchResults);
    fetchResults();
  });
</script>

<style>
  .text-center { text-align: center; }
  h1 { color: #fff; font-size: 1.8rem; }
  .btn-secondary {
    color: var(--gold, #D4AF37);
    border: 1px solid var(--gold, #D4AF37);
    padding: 6px 14px;
    border-radius: 8px;
    text-decoration: none;
    font-size: 0.85rem;
  }
  .btn-refresh {
    background: var(--gold, #D4AF37);
    color: #000;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 10px;
  }
</style>
