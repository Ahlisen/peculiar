package se.peculiar.expansion

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import se.peculiar.googleplaydownloaderlibrary.impl.DownloaderService
import se.peculiar.googleplaydownloaderlibrary.DownloaderClientMarshaller



/**
 * @author Fredrik Berglund
 * @created 2018-06-06
 */
class DownloaderServiceBroadcastReceiver: BroadcastReceiver() {
	override fun onReceive(context: Context, intent: Intent) {
		try {
			DownloaderClientMarshaller.startDownloadServiceIfRequired(context,
					intent,
					DownloaderService::class.java)
		} catch (e: PackageManager.NameNotFoundException) {
			e.printStackTrace()
		}
	}
}