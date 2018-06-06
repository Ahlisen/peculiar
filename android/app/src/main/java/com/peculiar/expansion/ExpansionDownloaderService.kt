package com.peculiar.expansion

import se.peculiar.googleplaydownloaderlibrary.impl.DownloaderService
import java.security.SecureRandom

/**
 * @author Fredrik Berglund
 * @created 2018-06-06
 */
class ExpansionDownloaderService: DownloaderService() {
	// You must use the public key belonging to your publisher account
	override fun getPublicKey(): String = "YourLVLKey" // TODO: Change to real key

	override fun getSALT(): ByteArray {
		val sr = SecureRandom.getInstance("SHA1PRNG")
		val salt = ByteArray(16)
		sr.nextBytes(salt)
		return salt
	}

	override fun getAlarmReceiverClassName(): String {
		return DownloaderServiceBroadcastReceiver::class.java.name
	}
}