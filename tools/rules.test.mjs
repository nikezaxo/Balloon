// Firestore rules tests. Run the Firestore emulator (firebase emulators:start --only firestore --project demo-balloon)
// next to a copy of firestore.rules, install @firebase/rules-unit-testing and firebase, then: node rules.test.mjs
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch, increment, serverTimestamp, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import fs from 'fs';
const env = await initializeTestEnvironment({ projectId: 'demo-balloon', firestore: { rules: fs.readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
await env.clearFirestore();
const db = uid => env.authenticatedContext(uid).firestore(), anon = env.unauthenticatedContext().firestore();
let pass = 0, fail = 0;
const t = async (name, p) => { try { await p; pass++; } catch (e) { fail++; console.log('FAIL', name, e.message.split('\n')[0]); } };
const look = { avatar: 'sunny', frame: 'basic', gold: false };
const entry = (name, score) => ({ name, score, stage: 'sky', skin: 'classic', ...look, clan: '', at: serverTimestamp() });
// Leaderboards and profiles
await t('own entry', assertSucceeds(setDoc(doc(db('alice'), 'leaders/alice'), entry('Alice', 5000))));
await t('other entry denied', assertFails(setDoc(doc(db('bob'), 'leaders/alice'), entry('Bob', 9))));
await t('lower score denied', assertFails(setDoc(doc(db('alice'), 'leaders/alice'), entry('Alice', 10))));
await t('anyone reads boards', assertSucceeds(getDocs(query(collection(anon, 'leaders'), orderBy('score', 'desc'), limit(5)))));
await t('extra field denied', assertFails(setDoc(doc(db('alice'), 'leaders/alice'), { ...entry('Alice', 6000), hack: 1 })));
const prof = (name, extra = {}) => ({ name, ...look, clanId: '', clanTag: '', clanName: '', best: 5000, skin: 'classic', at: serverTimestamp(), ...extra });
await t('own profile', assertSucceeds(setDoc(doc(db('alice'), 'profiles/alice'), prof('Alice', { gold: true, avatar: 'phoenix', frame: 'fire' }))));
await t('other profile denied', assertFails(setDoc(doc(db('bob'), 'profiles/alice'), prof('Evil'))));
await t('profile read', assertSucceeds(getDoc(doc(anon, 'profiles/alice'))));
// Clan creation by alice (leader)
const A = db('alice');
const clanDoc = (extra = {}) => ({ name: 'Sky Pirates', key: 'sky pirates', tag: 'SKY', desc: 'hi', badge: 'shield', color: '#ff4d5e', open: true, owner: 'alice', memberCount: 1, score: 5000, at: serverTimestamp(), ...extra });
const mem = (name, role, best = 100) => ({ name, ...look, role, best, at: serverTimestamp() });
{ const b = writeBatch(A); b.set(doc(A, 'clans/c1'), clanDoc()); b.set(doc(A, 'clans/c1/members/alice'), mem('Alice', 'leader', 5000)); await t('create clan', assertSucceeds(b.commit())); }
{ const B = db('bob'), b = writeBatch(B); b.set(doc(B, 'clans/c2'), clanDoc({ owner: 'alice' })); b.set(doc(B, 'clans/c2/members/bob'), mem('Bob', 'leader')); await t('create clan for someone else denied', assertFails(b.commit())); }
{ const B = db('bob'); await t('create clan without member denied', assertFails(setDoc(doc(B, 'clans/c3'), clanDoc({ owner: 'bob' })))); }
{ const B = db('bob'); await t('make yourself leader of existing clan denied', assertFails(setDoc(doc(B, 'clans/c1/members/bob'), mem('Bob', 'leader')))); }
// Bob joins open clan
{ const B = db('bob'), b = writeBatch(B); b.set(doc(B, 'clans/c1/members/bob'), mem('Bob', 'member', 300)); b.update(doc(B, 'clans/c1'), { memberCount: increment(1), score: increment(300) }); await t('join open clan', assertSucceeds(b.commit())); }
{ const C = db('carl'); await t('join as admin denied', assertFails(setDoc(doc(C, 'clans/c1/members/carl'), mem('Carl', 'admin')))); }
{ const B = db('bob'); await t('member promotes self denied', assertFails(updateDoc(doc(B, 'clans/c1/members/bob'), { role: 'admin' }))); }
{ const B = db('bob'); await t('member edits settings denied', assertFails(updateDoc(doc(B, 'clans/c1'), { desc: 'hacked' }))); }
{ const B = db('bob'); await t('member steals ownership denied', assertFails(updateDoc(doc(B, 'clans/c1'), { owner: 'bob' }))); }
{ const B = db('bob'); await t('member count +5 denied', assertFails(updateDoc(doc(B, 'clans/c1'), { memberCount: increment(5) }))); }
{ const B = db('bob'); await t('trophies lowered denied', assertFails(updateDoc(doc(B, 'clans/c1'), { score: 1 }))); }
{ const B = db('bob'), b = writeBatch(B); b.update(doc(B, 'clans/c1/members/bob'), { best: 900 }); b.update(doc(B, 'clans/c1'), { score: increment(600) }); await t('member new best adds trophies', assertSucceeds(b.commit())); }
{ const B = db('bob'); await t('member updates own look', assertSucceeds(updateDoc(doc(B, 'clans/c1/members/bob'), { name: 'Bobby', avatar: 'ghost', frame: 'gold', gold: true }))); }
// Leader promotes Bob, edits settings, closes clan
await t('leader promotes', assertSucceeds(updateDoc(doc(A, 'clans/c1/members/bob'), { role: 'admin' })));
{ const B = db('bob'); await t('admin edits settings', assertSucceeds(updateDoc(doc(B, 'clans/c1'), { desc: 'new', badge: 'crown', color: '#3d7bff', open: false }))); }
{ const B = db('bob'); await t('admin promotes others denied', assertFails(updateDoc(doc(B, 'clans/c1/members/alice'), { role: 'member' }))); }
// Closed clan: Carl requests, Dana joins directly denied
{ const D = db('dana'), b = writeBatch(D); b.set(doc(D, 'clans/c1/members/dana'), mem('Dana', 'member')); b.update(doc(D, 'clans/c1'), { memberCount: increment(1) }); await t('join closed clan directly denied', assertFails(b.commit())); }
{ const C = db('carl'); await t('request to join', assertSucceeds(setDoc(doc(C, 'clans/c1/requests/carl'), { name: 'Carl', ...look, best: 700, at: serverTimestamp() }))); }
{ const D = db('dana'); await t('admin-only accept by stranger denied', assertFails(setDoc(doc(D, 'clans/c1/members/carl'), mem('Carl', 'member')))); }
{ const B = db('bob'), b = writeBatch(B); b.set(doc(B, 'clans/c1/members/carl'), mem('Carl', 'member', 700)); b.delete(doc(B, 'clans/c1/requests/carl')); b.update(doc(B, 'clans/c1'), { memberCount: increment(1), score: increment(700) }); await t('admin accepts request', assertSucceeds(b.commit())); }
{ const B = db('bob'), b = writeBatch(B); b.set(doc(B, 'clans/c1/members/zed'), mem('Zed', 'member')); b.update(doc(B, 'clans/c1'), { memberCount: increment(1) }); await t('admin adds someone who never asked denied', assertFails(b.commit())); }
// Kicks
{ const C = db('carl'); await t('member kicks admin denied', assertFails(deleteDoc(doc(C, 'clans/c1/members/bob')))); }
{ const C = db('carl'); await t('member kicks leader denied', assertFails(deleteDoc(doc(C, 'clans/c1/members/alice')))); }
{ const B = db('bob'); await t('admin kicks leader denied', assertFails(deleteDoc(doc(B, 'clans/c1/members/alice')))); }
{ const B = db('bob'), b = writeBatch(B); b.delete(doc(B, 'clans/c1/members/carl')); b.update(doc(B, 'clans/c1'), { memberCount: increment(-1) }); await t('admin kicks member', assertSucceeds(b.commit())); }
// Hand over leadership, then leave
{ const b = writeBatch(A); b.update(doc(A, 'clans/c1'), { owner: 'bob' }); b.update(doc(A, 'clans/c1/members/bob'), { role: 'leader' }); b.update(doc(A, 'clans/c1/members/alice'), { role: 'admin' }); await t('leader hands over', assertSucceeds(b.commit())); }
{ const b = writeBatch(A); b.update(doc(A, 'clans/c1'), { owner: 'alice' }); await t('old leader takes it back denied', assertFails(b.commit())); }
{ const b = writeBatch(A); b.delete(doc(A, 'clans/c1/members/alice')); b.update(doc(A, 'clans/c1'), { memberCount: increment(-1) }); await t('member leaves', assertSucceeds(b.commit())); }
{ const B = db('bob'); await t('disband with no one else', assertSucceeds((async () => { const b = writeBatch(B); b.delete(doc(B, 'clans/c1/members/bob')); b.delete(doc(B, 'clans/c1')); await b.commit(); })())); }
const snap = await getDoc(doc(anon, 'clans/c1'));
await t('clan gone', snap.exists() ? Promise.reject(new Error('still exists')) : Promise.resolve());
// Leader leaving with members passes leadership
{ const b = writeBatch(A); b.set(doc(A, 'clans/c9'), clanDoc({ name: 'Nine Lives', key: 'nine lives', tag: 'NINE' })); b.set(doc(A, 'clans/c9/members/alice'), mem('Alice', 'leader', 5000)); await b.commit(); }
{ const B = db('bob'), b = writeBatch(B); b.set(doc(B, 'clans/c9/members/bob'), mem('Bob', 'member', 300)); b.update(doc(B, 'clans/c9'), { memberCount: increment(1), score: increment(300) }); await b.commit(); }
{ const b = writeBatch(A); b.update(doc(A, 'clans/c9'), { owner: 'bob', memberCount: increment(-1) }); b.update(doc(A, 'clans/c9/members/bob'), { role: 'leader' }); b.delete(doc(A, 'clans/c9/members/alice')); await t('leader leaves and passes leadership', assertSucceeds(b.commit())); }
{ const C = db('carl'), b = writeBatch(C); b.set(doc(C, 'clans/c9/members/carl'), mem('Carl', 'member', 10)); b.update(doc(C, 'clans/c9'), { memberCount: increment(1), score: increment(10) }); await t('carl joins c9', assertSucceeds(b.commit())); }
{ const B = db('bob'); await t('disband with members left denied', assertFails(deleteDoc(doc(B, 'clans/c9')))); }
// Saves stay private
await t('own save', assertSucceeds(setDoc(doc(A, 'players/alice'), { save: '{}', at: serverTimestamp() })));
await t('read other save denied', assertFails(getDoc(doc(db('bob'), 'players/alice'))));
// Season ranking
const sp = (name, n, extra = {}) => ({ name, sp: n, ...look, clan: '', at: serverTimestamp(), ...extra });
await t('own season entry', assertSucceeds(setDoc(doc(A, 'seasons/S1/players/alice'), sp('Alice', 900))));
await t('season points go up', assertSucceeds(setDoc(doc(A, 'seasons/S1/players/alice'), sp('Alice', 1200))));
await t('season points down denied', assertFails(setDoc(doc(A, 'seasons/S1/players/alice'), sp('Alice', 100))));
await t('other season entry denied', assertFails(setDoc(doc(db('bob'), 'seasons/S1/players/alice'), sp('Bob', 5))));
await t('bad season id denied', assertFails(setDoc(doc(A, 'seasons/2026/players/alice'), sp('Alice', 5))));
await t('extra season field denied', assertFails(setDoc(doc(A, 'seasons/S2/players/alice'), sp('Alice', 5, { legend: true }))));
await t('anyone reads season ranking', assertSucceeds(getDocs(query(collection(anon, 'seasons/S1/players'), orderBy('sp', 'desc'), limit(5)))));
// Player card stats on profiles
const statsProf = (extra = {}) => ({ name: 'Alice', ...look, clanId: '', clanTag: '', clanName: '', best: 5000, skin: 'classic', at: serverTimestamp(), ...extra });
const stats = { scores: { sky: 5000, cave: 1200 }, stars: { sky: 3, cave: 1 }, bosses: 14, seasonId: 'S1', sp: 2400, legend: false, hist: 'S1:3:2400', items: 2 };
await t('profile with stats', assertSucceeds(setDoc(doc(A, 'profiles/alice'), statsProf(stats))));
await t('profile without stats still ok', assertSucceeds(setDoc(doc(A, 'profiles/alice'), statsProf())));
await t('unknown stage in scores denied', assertFails(setDoc(doc(A, 'profiles/alice'), statsProf({ ...stats, scores: { moon: 5 } }))));
await t('four stars denied', assertFails(setDoc(doc(A, 'profiles/alice'), statsProf({ ...stats, stars: { sky: 4 } }))));
await t('text score denied', assertFails(setDoc(doc(A, 'profiles/alice'), statsProf({ ...stats, scores: { sky: 'lots' } }))));
await t('long season history denied', assertFails(setDoc(doc(A, 'profiles/alice'), statsProf({ ...stats, hist: 'x'.repeat(201) }))));
await t('bad season id denied', assertFails(setDoc(doc(A, 'profiles/alice'), statsProf({ ...stats, seasonId: 'winter' }))));
await t('anyone reads profiles', assertSucceeds(getDoc(doc(anon, 'profiles/alice'))));
console.log(`${pass} passed, ${fail} failed`);
await env.cleanup(); process.exit(fail ? 1 : 0);
