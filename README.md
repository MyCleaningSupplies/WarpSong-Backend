# WarpSong Backend

A real-time music collaboration platform enabling users to share, collect, and remix stems in synchronized sessions.

## 🎵 Features

### User Management
- Secure authentication using JWT
- QR code-based stem collection system
- Personal stem library management

### Stem Management
- Upload and store audio stems (Drums, Bass, Melodie, Vocals)
- Cloudinary integration for audio file storage
- Metadata tracking (BPM, musical key, artist)
- QR code scanning for stem collection

### Real-time Collaboration
- Live remix sessions with up to 4 participants
- Synchronized playback across all users
- Real-time BPM control
- Dynamic stem selection and switching
- Session persistence with 24-hour expiry

## 🛠 Tech Stack

- **Backend Framework:** Node.js + Express
- **Database:** MongoDB with Mongoose
- **Real-time Communication:** Socket.IO
- **File Storage:** Cloudinary
- **Authentication:** JWT (JSON Web Tokens)
- **Audio Processing:** Native Web Audio API support

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB instance
- Cloudinary account

### Installation

1. Clone the repository
```bash
git clone https://github.com/MyCleaningSupplies/WarpSong-Backend.git
cd WarpSong-Backend