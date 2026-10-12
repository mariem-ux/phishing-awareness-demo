import React from "react";

export const Menu = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
export const Search = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const Sparkle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#0056d2"><path d="M10 2l2.2 6.3L18.5 10.5l-6.3 2.2L10 19l-2.2-6.3L1.5 10.5l6.3-2.2z" /><path d="M19 2l1 2.5L22.5 5.5 20 6.5 19 9l-1-2.5-2.5-1L18 4.5z" /></svg>
);
export const Close = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 5l14 14M19 5 5 19" /></svg>
);
export const Pencil = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></svg>
);
export const Eye = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const EyeOff = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7c2 0 3.700.6 5.200 1.500M22 12s-3.500 7-10 7c-2 0-3.700-.6-5.200-1.500" /><path d="M9.500 9.500a3 3 0 0 0 4.200 4.200M3 3l18 18" /></svg>
);
export const Google = () => (
  <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.500c3.500 0 6.600 1.200 9.100 3.600l6.800-6.800C35.800 2.400 30.300 0 24 0 14.600 0 6.500 5.400 2.600 13.200l7.900 6.100C12.400 13.600 17.700 9.500 24 9.500z" /><path fill="#4285F4" d="M46.500 24.500c0-1.600-.1-3.100-.4-4.500H24v9h12.700c-.6 3-2.300 5.500-4.800 7.200l7.500 5.800c4.400-4.100 7.100-10.100 7.100-17.500z" /><path fill="#FBBC05" d="M10.500 28.700A14.500 14.500 0 0 1 9.500 24c0-1.600.3-3.200.9-4.700l-7.900-6.100A24 24 0 0 0 0 24c0 3.900.9 7.500 2.600 10.800l7.900-6.100z" /><path fill="#34A853" d="M24 48c6.500 0 11.900-2.100 15.900-5.800l-7.500-5.800c-2.100 1.400-4.800 2.300-8.400 2.300-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.500 42.600 14.600 48 24 48z" /></svg>
);
export const Facebook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877f2"><path d="M22 12a10 10 0 1 0-11.600 9.900v-7H7.900V12h2.500V9.800c0-2.500 1.500-3.900 3.800-3.900 1.100 0 2.200.2 2.200.2v2.500h-1.300c-1.200 0-1.600.8-1.600 1.600V12h2.800l-.4 2.900h-2.300v7A10 10 0 0 0 22 12z" /></svg>
);
export const Apple = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M16.400 12.600c0-2.400 2-3.500 2.100-3.600-1.100-1.700-2.900-1.900-3.500-1.900-1.500-.2-2.900.9-3.700.9s-1.900-.9-3.200-.8c-1.600 0-3.100 1-4 2.400-1.700 3-.4 7.300 1.200 9.700.8 1.200 1.800 2.500 3 2.400 1.200 0 1.700-.8 3.100-.8s1.900.8 3.200.7c1.300 0 2.200-1.200 3-2.400.9-1.300 1.300-2.600 1.300-2.700-.1 0-2.500-1-2.500-3.900zM14 5.500c.7-.8 1.100-1.900 1-3-1 0-2.100.7-2.800 1.500-.6.700-1.200 1.800-1 2.900 1.100.1 2.100-.6 2.800-1.400z" /></svg>
);
export const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.500" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const Social = ({ name }) => {
  const paths = {
    facebook: <path d="M14 8h2V5h-2.500C11.300 5 10 6.500 10 8.600V11H8v3h2v6h3v-6h2.200l.4-3H13V8.800c0-.5.2-.8 1-.8z" fill="#fff" />,
    linkedin: <path d="M7 10h2.400v7H7zM8.200 6.500a1.300 1.300 0 1 1 0 2.600 1.300 1.300 0 0 1 0-2.600zM11 10h2.300v1c.4-.7 1.300-1.200 2.400-1.200 2.300 0 2.800 1.500 2.800 3.500V17h-2.400v-3.300c0-.8 0-1.800-1.100-1.800s-1.300.9-1.300 1.800V17H11z" fill="#fff" />,
    twitter: <path d="M18 8.500c-.4.200-.8.300-1.300.400.500-.3.800-.7 1-1.300-.4.300-.9.500-1.400.600a2.300 2.300 0 0 0-3.900 2.100c-1.900-.1-3.600-1-4.700-2.400-.6 1-.3 2.300.7 3-.4 0-.7-.1-1-.3 0 1.100.8 2.100 1.800 2.300-.3.100-.7.100-1 0 .3.900 1.100 1.600 2.100 1.600A4.600 4.600 0 0 1 6 16.700 6.500 6.500 0 0 0 16.400 11v-.3c.7-.4 1.200-.9 1.600-1.500z" fill="#fff" />,
    youtube: <path d="M10 9v6l5-3z" fill="#fff" />,
    instagram: <g fill="none" stroke="#fff" strokeWidth="1.600"><rect x="6.500" y="6.500" width="11" height="11" rx="3" /><circle cx="12" cy="12" r="2.600" /></g>,
    tiktok: <path d="M13 6v8.200a2 2 0 1 1-2-2M13 6c.2 1.700 1.300 2.800 3 3" fill="none" stroke="#fff" strokeWidth="1.800" strokeLinecap="round" />,
  };
  return (
    <svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#000" />{paths[name]}</svg>
  );
};
