import React from 'react'
// import not from '../../assets/404.jpg'
const NotFound = () => {
  return (
   <>
        <div style={{height:"100vh"}}>
            <img src={require("../../assets/404.jpg")} alt='not found' style={{width:'100%', height:"100%", objectFit:"cover"}}/>
        </div>
   </>
  )
}

export default NotFound