import { useState } from 'react'
import AvatarPicker from '@/components/AvatarPicker'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'

export default function Register(){
  const [displayName,setDisplayName]=useState('')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirm,setConfirm]=useState('')
  const [avatar, setAvatar] = useState({ seed: 'dojo', url: 'https://api.dicebear.com/7.x/pixel-art/svg?size=96&seed=dojo' })
  const [fav,setFav]=useState('ps5')
  const [err,setErr]=useState('')
  const navigate = useNavigate()

  const onSubmit=async(e)=>{
    e.preventDefault()
    setErr('')
    if(password!==confirm){ setErr('Las contraseñas no coinciden'); return }
    try{
      console.log('Avatar before registration:', avatar); // Debug log
      
      const auth=getAuth()
      const {user}=await createUserWithEmailAndPassword(auth,email,password)
      
      console.log('User created, updating profile with photoURL:', avatar?.url); // Debug log
      await updateProfile(user,{ 
        displayName, 
        photoURL: avatar?.url || null 
      });
      console.log('Profile updated, saving to Firestore...'); // Debug log

      const db=getFirestore()
      const userData = {
        uid: user.uid,
        displayName,
        email,
        photoURL: avatar?.url || null,
        favoritePlatform: fav,
        createdAt: serverTimestamp()
      };
      console.log('Saving user data to Firestore:', userData); // Debug log
      await setDoc(doc(db,'users',user.uid), userData);

      navigate('/')
    }catch(e){ setErr(e.message) }
  }

  return (
    <div className="gba-screen">
      <div className="gba-card">
        <h2 className="gba-title">Crear cuenta</h2>
        <form onSubmit={onSubmit} className="gba-formgrid">
          <div>
            <label>Nombre de jugador</label>
            <input className="gba-select" value={displayName} onChange={e=>setDisplayName(e.target.value)} required />
          </div>
          <div>
            <label>Email</label>
            <input className="gba-select" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>
          <div>
            <label>Contraseña</label>
            <input className="gba-select" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
          </div>
          <div>
            <label>Repetir contraseña</label>
            <input className="gba-select" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/>
          </div>

          <div style={{gridColumn:'1/-1'}}>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </div>

          <div>
            <label>Plataforma favorita</label>
            <select className="gba-select" value={fav} onChange={e=>setFav(e.target.value)}>
              <option value="ps4">PS4</option>
              <option value="ps5">PS5</option>
              <option value="xbox">Xbox</option>
              <option value="simulador">Simuladores</option>
            </select>
          </div>

          {err && <p style={{color:'#ff7a7a',gridColumn:'1/-1'}}>{err}</p>}

          <div style={{gridColumn:'1/-1',display:'flex',gap:8}}>
            <button className="gba-tab" type="submit">Registrarme</button>
          </div>
        </form>
      </div>
    </div>
  )
}
