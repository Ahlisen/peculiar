package se.peculiar

import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.os.*
import android.support.constraint.Group
import android.support.v7.app.AppCompatActivity
import android.util.Log
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import com.android.vending.expansion.zipfile.ZipResourceFile
import se.peculiar.googleplaydownloaderlibrary.*
import se.peculiar.googleplaydownloaderlibrary.impl.DownloaderService
import java.io.DataInputStream
import java.io.IOException
import java.util.zip.CRC32


class BootActivity : AppCompatActivity(), IDownloaderClient {

	private lateinit var downloadGroup: Group
	private lateinit var downloadProgressBar: ProgressBar
	private lateinit var downloadProgressPercent: TextView

	private var mRemoteService: IDownloaderService? = null
	private var mDownloaderClientStub: IStub? = null
	private var mState: Int = 0
	private var mCancelValidation: Boolean = false

	// TODO -> ALWAYS CHANGE THIS WHEN UPDATING APK EXPANSION FILE!!
	private val expansionFileSize = if (BuildConfig.DEBUG) 835554L else 9000L
	private val xAPKS = arrayOf(XAPKFile(
			true, // true signifies a main file
			1, // the version of the APK that the file was uploaded against
			expansionFileSize // the length of the file in bytes
	))

	override fun onCreate(savedInstanceState: Bundle?) {
		super.onCreate(savedInstanceState)
		setContentView(R.layout.activity_boot)

		downloadGroup = findViewById(R.id.download_group)
		downloadProgressBar = findViewById(R.id.download_progress_bar)
		downloadProgressPercent = findViewById(R.id.download_progress_percent_text)

		mDownloaderClientStub = DownloaderClientMarshaller.CreateStub(this,
				DownloaderService::class.java)

		/**
		 * Before we do anything, are the files we expect already here and
		 * delivered (presumably by Market) For free titles, this is probably
		 * worth doing. (so no Market request is necessary)
		 */
		if (!expansionFilesDelivered()) {

			try {
				val launchIntent = this@BootActivity.intent
				val intentToLaunchThisActivityFromNotification = Intent(this@BootActivity,
						this@BootActivity.javaClass)
				intentToLaunchThisActivityFromNotification.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
				intentToLaunchThisActivityFromNotification.action = launchIntent.action

				if (launchIntent.categories != null) {
					for (category in launchIntent.categories) {
						intentToLaunchThisActivityFromNotification.addCategory(category)
					}
				}

				// Build PendingIntent used to open this activity from
				// Notification
				val pendingIntent = PendingIntent.getActivity(this@BootActivity,
						0,
						intentToLaunchThisActivityFromNotification,
						PendingIntent.FLAG_UPDATE_CURRENT)
				// Request to start the download
				val startResult = DownloaderClientMarshaller.startDownloadServiceIfRequired(this,
						pendingIntent,
						DownloaderService::class.java)

				if (startResult != DownloaderClientMarshaller.NO_DOWNLOAD_REQUIRED) {
					// The DownloaderService has started downloading the files, show progress
					initializeDownloadUI()
					return
				} else { // otherwise, download not needed so we fall through to the app
					startMainActivity()
				}
			} catch (e: PackageManager.NameNotFoundException) {
				Log.e(TAG, "Cannot find package!", e)
			}

		} else {
			validateXAPKZipFiles()
		}
	}

	/**
	 * Connect the stub to our service on start.
	 */
	override fun onStart() {
		mDownloaderClientStub?.connect(this)
		super.onStart()
	}

	/**
	 * Disconnect the stub from our service on stop
	 */
	override fun onStop() {
		Log.d(TAG, "Stopping!")
		mDownloaderClientStub?.disconnect(this)
		super.onStop()
	}

	override fun onDestroy() {
		this.mCancelValidation = true
		super.onDestroy()
	}

	/**
	 * Critical implementation detail. In onServiceConnected we create the
	 * remote service and marshaler. This is how we pass the client information
	 * back to the service so the client can be properly notified of changes. We
	 * must do this every time we reconnect to the service.
	 */
	override fun onServiceConnected(m: Messenger) {
		mRemoteService = DownloaderServiceMarshaller.CreateProxy(m)
		mRemoteService?.onClientUpdated(mDownloaderClientStub?.messenger)
	}

	/**
	 * The download state should trigger changes in the UI --- it may be useful
	 * to show the state as being indeterminate at times. This sample can be
	 * considered a guideline.
	 */
	override fun onDownloadStateChanged(newState: Int) {
		setState(newState)
		var showDashboard = true
		var showCellMessage = false
		val paused: Boolean
		val indeterminate: Boolean
		when (newState) {
			IDownloaderClient.STATE_IDLE -> {
				// STATE_IDLE means the service is listening, so it's
				// safe to start making calls via mRemoteService.
				paused = false
				indeterminate = true
			}
			IDownloaderClient.STATE_CONNECTING, IDownloaderClient.STATE_FETCHING_URL -> {
				showDashboard = true
				paused = false
				indeterminate = true
			}
			IDownloaderClient.STATE_DOWNLOADING -> {
				paused = false
				showDashboard = true
				indeterminate = false
			}

			IDownloaderClient.STATE_FAILED_CANCELED, IDownloaderClient.STATE_FAILED, IDownloaderClient.STATE_FAILED_FETCHING_URL, IDownloaderClient.STATE_FAILED_UNLICENSED -> {
				paused = true
				showDashboard = false
				indeterminate = false
			}
			IDownloaderClient.STATE_PAUSED_NEED_CELLULAR_PERMISSION, IDownloaderClient.STATE_PAUSED_WIFI_DISABLED_NEED_CELLULAR_PERMISSION -> {
				showDashboard = false
				paused = true
				indeterminate = false
				showCellMessage = true
			}

			IDownloaderClient.STATE_PAUSED_BY_REQUEST -> {
				paused = true
				indeterminate = false
			}
			IDownloaderClient.STATE_PAUSED_ROAMING, IDownloaderClient.STATE_PAUSED_SDCARD_UNAVAILABLE -> {
				paused = true
				indeterminate = false
			}
			IDownloaderClient.STATE_COMPLETED -> {
				showDashboard = false
				paused = false
				indeterminate = false
				validateXAPKZipFiles()
				return
			}
			else -> {
				paused = true
				indeterminate = true
				showDashboard = true
			}
		}
		val newDashboardVisibility = if (showDashboard) View.VISIBLE else View.GONE
		if (downloadGroup.visibility != newDashboardVisibility) {
			downloadGroup.visibility = newDashboardVisibility
		}
		downloadProgressBar.isIndeterminate = indeterminate
	}

	/**
	 * Sets the state of the various controls based on the progressinfo object
	 * sent from the downloader service.
	 */
	override fun onDownloadProgress(progress: DownloadProgressInfo) {
		downloadProgressBar.max = (progress.mOverallTotal shr 8).toInt()
		downloadProgressBar.progress = (progress.mOverallProgress shr 8).toInt()
		downloadProgressPercent.text = getString(R.string.progress_percent, progress.mOverallProgress * 100 / progress.mOverallTotal)
	}

	private fun initializeDownloadUI() {
		downloadGroup.visibility = View.VISIBLE
	}

	/**
	 * Go through each of the Expansion APK files and open each as a zip file.
	 * Calculate the CRC for each file and return false if any fail to match.
	 *
	 * @return true if XAPKZipFile is successful
	 */
	private fun validateXAPKZipFiles() {
		val validationTask = object : AsyncTask<Any, DownloadProgressInfo, Boolean>() {

			override fun onPreExecute() {
				downloadGroup.visibility = View.VISIBLE
				super.onPreExecute()
			}

			override fun doInBackground(vararg params: Any): Boolean? {
				for (xf in xAPKS) {
					var fileName = Helpers.getExpansionAPKFileName(this@BootActivity,
							xf.mIsMain,
							xf.mFileVersion)
					if (!Helpers.doesFileExist(this@BootActivity, fileName, xf.mFileSize, false))
						return false
					fileName = Helpers.generateSaveFileName(this@BootActivity, fileName)
					val zrf: ZipResourceFile
					val buf = ByteArray(1024 * 256)
					try {
						zrf = ZipResourceFile(fileName)
						val entries = zrf.allEntries
						/**
						 * First calculate the total compressed length
						 */
						var totalCompressedLength: Long = 0
						for (entry in entries) {
							totalCompressedLength += entry.mCompressedLength
						}
						var averageVerifySpeed = 0f
						var totalBytesRemaining = totalCompressedLength
						var timeRemaining: Long
						/**
						 * Then calculate a CRC for every file in the Zip file,
						 * comparing it to what is stored in the Zip directory.
						 * Note that for compressed Zip files we must extract
						 * the contents to do this comparison.
						 */
						for (entry in entries) {
							if (-1L != entry.mCRC32) {
								var length = entry.mUncompressedLength
								val crc = CRC32()
								var dis: DataInputStream? = null
								try {
									dis = DataInputStream(zrf.getInputStream(entry.mFileName))

									var startTime = SystemClock.uptimeMillis()
									while (length > 0) {
										val seek = if (length > buf.size) buf.size else length.toInt()
										dis.readFully(buf, 0, seek)
										crc.update(buf, 0, seek)
										length -= seek.toLong()
										val currentTime = SystemClock.uptimeMillis()
										val timePassed = currentTime - startTime
										if (timePassed > 0) {
											val currentSpeedSample = seek.toFloat() / timePassed.toFloat()
											averageVerifySpeed = if (0f != averageVerifySpeed) {
												SMOOTHING_FACTOR * currentSpeedSample + (1 - SMOOTHING_FACTOR) * averageVerifySpeed
											} else {
												currentSpeedSample
											}
											totalBytesRemaining -= seek.toLong()
											timeRemaining = (totalBytesRemaining / averageVerifySpeed).toLong()
											this.publishProgress(DownloadProgressInfo(
													totalCompressedLength,
													totalCompressedLength - totalBytesRemaining,
													timeRemaining,
													averageVerifySpeed))
										}
										startTime = currentTime
										if (mCancelValidation)
											return true
									}
									if (crc.value !== entry.mCRC32) {
										Log.e(Constants.TAG,
												"CRC does not match for entry: " + entry.mFileName)
										Log.e(Constants.TAG, "In file: " + entry.zipFileName)
										return false
									}
								} finally {
									if (null != dis) {
										dis.close()
									}
								}
							}
						}
					} catch (e: IOException) {
						e.printStackTrace()
						return false
					}

				}
				return true
			}

			override fun onProgressUpdate(vararg values: DownloadProgressInfo) {
				onDownloadProgress(values[0])
				super.onProgressUpdate(values[0])
			}

			override fun onPostExecute(result: Boolean) {
				if (result) {
					downloadGroup.visibility = View.GONE
					startMainActivity()
				} else {
					downloadGroup.visibility = View.VISIBLE
				}
				super.onPostExecute(result)
			}

		}
		validationTask.execute()
	}

	private fun expansionFilesDelivered(): Boolean {
		for (xf in xAPKS) {
			val fileName = Helpers.getExpansionAPKFileName(this, xf.mIsMain, xf.mFileVersion)
			if (!Helpers.doesFileExist(this, fileName, xf.mFileSize, false))
				return false
		}
		return true
	}

	private fun setState(newState: Int) {
		if (mState != newState) {
			mState = newState
		}
	}

	private fun startMainActivity() {
		Handler().postDelayed({
			val intent = Intent(this, MainActivity::class.java)
			startActivity(intent)
			finish()
		}, 1000)
	}

	// region Expansion Downloader
	private class XAPKFile internal constructor(val mIsMain: Boolean,
												val mFileVersion: Int,
												val mFileSize: Long)

	companion object {
		const val TAG = "BootActivity"
		private const val SMOOTHING_FACTOR = 0.005f
	}
}
