import { QRCodeSVG } from "qrcode.react"

export default function AttendanceQR({ sessionId }) {

    const url = `ATTENDANCE:${sessionId}`

    return (
        <div className="rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-sm">

            <h2 className="text-lg font-bold mb-4 text-center dark:text-white">
                Class Attendance QR
            </h2>

            {/* QR center container */}
            <div className="flex justify-center items-center">
                <QRCodeSVG value={url} size={220} />
            </div>

            <p className="text-xs text-gray-400 mt-4 text-center">
                Students scan this QR to mark attendance
            </p>

        </div>
    )
}