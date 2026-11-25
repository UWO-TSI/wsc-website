# Western Sales Club Website

This is the website for the Western Sales Club (WSC). This website establishes them as a key player in Western's club community, and helps them attract clients for their sales agency. 

This website is paired to a **Content Management System (CMS)**. Executives sign in at `/admin`, and the site opens in **edit mode**: every piece of text, every photo, the statistics, events, executives and partners can be changed where it appears, and nothing goes live until they press Publish. The admin roster, roles and areas are on the Settings page at `/admin/settings`. Page structure and section order stay in code.

This is a full-stack application: a Next.js frontend connected to a **Supabase backend**. Executives sign in with **Google** and must pass an **authenticator-app code (TOTP 2FA)** before they can change anything. Admin access is invite-only and lasts until another admin removes it. How access works, and the Supabase dashboard settings it depends on, are in [`supabase/README.md`](supabase/README.md).

---

![Frontend Preview](public/screenshots/landing.png)
*Main Website (Frontend) Preview*

---

This application was designed and built by Tethos Team 4 (Winter 2025): 

**Project Managers**
<p>
  <a href="https://github.com/LlamzonAmazon">
    <img src="https://img.shields.io/badge/Thomas_Llamzon-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  <a href="https://github.com/JXOHG">
    <img src="https://img.shields.io/badge/Justin_Oh-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
</p>

**Developers**
<p>
  <a href="https://github.com/AndresPedrerosC">
    <img src="https://img.shields.io/badge/Andres_Pedreros_Castro-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  <a href="https://github.com/addetude">
    <img src="https://img.shields.io/badge/Adeline_Lue_Sang-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  <a href="https://youtu.be/dQw4w9WgXcQ?si=ouBoPQZlsa44TyCc">
    <img src="https://img.shields.io/badge/Kenneth_Li-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  <a href="https://github.com/ethan-ung9">
    <img src="https://img.shields.io/badge/Ethan_Ung-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
  <a href="https://github.com/harryyangzy">
    <img src="https://img.shields.io/badge/Harry_Yang-181717?style=for-the-badge&logo=github&logoColor=white" />
  </a>
</p>
