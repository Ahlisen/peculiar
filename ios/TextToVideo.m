//
//  TextToVideo.m
//  peculiar
//
//  Created by Marcus Ahlström on 2018-07-01.
//  Copyright © 2018 Facebook. All rights reserved.
//
#import "TextToVideo.h"
#import <React/RCTLog.h>

@implementation TextToVideo
RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(generate:(NSString *)text:(NSString *)index:(RCTResponseSenderBlock)callback) {
  RCTLogInfo(@"Recieving this: %@", text);
  NSLog(@"Recieving this: %@", text);
  
  NSString *finalPath = [TextToVideo videoFromString:text size:CGSizeMake(768.0, 768.0) fileName:index];
  
  NSArray *events = @[finalPath];
  callback(@[[NSNull null], events]);
}

+ (UIImage *)imageFromString:(NSString *)input size:(CGSize)size {
  NSMutableParagraphStyle* style = [[NSMutableParagraphStyle alloc] init];
  [style setAlignment:NSTextAlignmentCenter];
  NSDictionary *attributes = @{ NSForegroundColorAttributeName: UIColor.blackColor, NSFontAttributeName: [UIFont boldSystemFontOfSize:72], NSParagraphStyleAttributeName: style };
  
  UIGraphicsBeginImageContext(size);
  CGContextRef context = UIGraphicsGetCurrentContext();
  [[UIColor whiteColor] setFill];
  CGContextFillRect(context, CGRectMake(0, 0, size.width, size.height));
  
  [input drawInRect:CGRectMake(0, size.height/3, size.width, size.height) withAttributes:attributes];
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  
  return image;
}

+ (NSString*)videoFromString:(NSString *)input size:(CGSize)size fileName:(NSString *)fileName
{
  // You can save a .mov or a .mp4 file
  NSString *fileNameOut = [NSString stringWithFormat:@"temp_%@.mp4", fileName]; //@"temp.mp4";
  
  // We chose to save in the tmp/ directory on the device initially
  NSString *directoryOut = @"Library/Caches/";
  NSString *outFile = [NSString stringWithFormat:@"%@%@", directoryOut, fileNameOut];
  NSString *path = [NSHomeDirectory() stringByAppendingPathComponent:[NSString stringWithFormat:@"%@", outFile]];
  NSURL *videoTempURL = [NSURL fileURLWithPath:[NSString stringWithFormat:@"%@%@", NSTemporaryDirectory(), fileNameOut]];
  
  // WARNING: AVAssetWriter does not overwrite files for us, so remove the destination file if it already exists
  NSFileManager *fileManager = [NSFileManager defaultManager];
  [fileManager removeItemAtPath:[videoTempURL path]  error:NULL];
  
  // Create your own array of UIImages
  NSMutableArray *images = [NSMutableArray array];
  for (int i=0; i<5; i++) {
    NSString *text = [NSString stringWithFormat:@"%@ + %i", input, i];
    UIImage *image = [self imageFromString:text size:size];
    [images addObject:image];
  }
  
  return [self writeImageAsMovie:images toPath:path size:size fileName:fileName];
}

+ (NSString*)writeImageAsMovie:(NSArray *)array toPath:(NSString*)path size:(CGSize)size fileName:(NSString*)fileName
{
  
  NSError *error = nil;
  
  // FIRST, start up an AVAssetWriter instance to write your video
  // Give it a destination path (for us: tmp/temp.mov)
  AVAssetWriter *videoWriter = [[AVAssetWriter alloc] initWithURL:[NSURL fileURLWithPath:path] fileType:AVFileTypeMPEG4 error:&error];
  
  NSParameterAssert(videoWriter);
  
  NSDictionary *videoSettings = [NSDictionary dictionaryWithObjectsAndKeys:
                                 AVVideoCodecTypeH264, AVVideoCodecKey,
                                 [NSNumber numberWithInt:size.width], AVVideoWidthKey,
                                 [NSNumber numberWithInt:size.height], AVVideoHeightKey,
                                 nil];
  
  AVAssetWriterInput* writerInput = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo
                                                                       outputSettings:videoSettings];
  
  AVAssetWriterInputPixelBufferAdaptor *adaptor = [AVAssetWriterInputPixelBufferAdaptor assetWriterInputPixelBufferAdaptorWithAssetWriterInput:writerInput
                                                                                                                   sourcePixelBufferAttributes:nil];
  NSParameterAssert(writerInput);
  NSParameterAssert([videoWriter canAddInput:writerInput]);
  [videoWriter addInput:writerInput];
  //Start a SESSION of writing.
  // After you start a session, you will keep adding image frames
  // until you are complete - then you will tell it you are done.
  [videoWriter startWriting];
  // This starts your video at time = 0
  [videoWriter startSessionAtSourceTime:kCMTimeZero];
  
  CVPixelBufferRef buffer = NULL;
  
  int i = 0;
  while (1)
  {
    // Check if the writer is ready for more data, if not, just wait
    if(writerInput.readyForMoreMediaData){
      
      CMTime frameTime = CMTimeMake(150, 600);
      // CMTime = Value and Timescale.
      // Timescale = the number of tics per second you want
      // Value is the number of tics
      // For us - each frame we add will be 1/4th of a second
      // Apple recommend 600 tics per second for video because it is a
      // multiple of the standard video rates 24, 30, 60 fps etc.
      CMTime lastTime=CMTimeMake(i*150, 600);
      CMTime presentTime=CMTimeAdd(lastTime, frameTime);
      
      if (i == 0) {presentTime = CMTimeMake(0, 600);}
      // This ensures the first frame starts at 0.
      
      if (i >= [array count])
      {
        buffer = NULL;
      }
      else
      {
        // This command grabs the next UIImage and converts it to a CGImage
        buffer = [self pixelBufferFromCGImage:[[array objectAtIndex:i] CGImage] size:size];
      }
      
      if (buffer)
      {
        // Give the CGImage to the AVAssetWriter to add to your video
        [adaptor appendPixelBuffer:buffer withPresentationTime:presentTime];
        i++;
      }
      else
      {
        //Finish the session:
        // This is important to be done exactly in this order
        [writerInput markAsFinished];
        // WARNING: finishWriting in the solution above is deprecated.
        // You now need to give a completion handler.
        [videoWriter finishWritingWithCompletionHandler:^{
          NSLog(@"Finished writing...checking completion status...");
          if (videoWriter.status != AVAssetWriterStatusFailed && videoWriter.status == AVAssetWriterStatusCompleted)
          {
            NSLog(@"Video writing succeeded.");
//            NSURL *videoTempURL = [NSURL fileURLWithPath:[NSString stringWithFormat:@"%@", path]];
//            [self saveMedia:videoTempURL];
            [TextToVideo addAudio:path fileName:fileName];
          } else
          {
            NSLog(@"Video writing failed: %@", videoWriter.error);
          }
        }]; // end videoWriter finishWriting Block
        
        CVPixelBufferPoolRelease(adaptor.pixelBufferPool);
        
        NSLog (@"Done");
        return path;
        break;
      }
    }
  }
}

+ (void) addAudio:(NSString *)path fileName:(NSString *)fileName
{
  AVMutableComposition* composition = [[AVMutableComposition alloc]init];
  AVURLAsset* video1 = [[AVURLAsset alloc]initWithURL:[NSURL fileURLWithPath:path]options:nil];

  NSString * audioPath = [[NSBundle mainBundle] pathForResource:@"shorter" ofType:@"m4a"];
  NSURL *audioURL = [NSURL fileURLWithPath:audioPath];
  AVAsset *audioAsset = [AVAsset assetWithURL:audioURL];

  //Create mutable composition of audio type
  AVMutableCompositionTrack *audioTrack = [composition addMutableTrackWithMediaType:AVMediaTypeAudio preferredTrackID:kCMPersistentTrackID_Invalid];

  [audioTrack insertTimeRange:CMTimeRangeMake(kCMTimeZero,video1.duration)
                      ofTrack:[[audioAsset tracksWithMediaType:AVMediaTypeAudio] objectAtIndex:0] atTime:kCMTimeZero error:nil];

  AVMutableCompositionTrack* composedTrack = [composition addMutableTrackWithMediaType:AVMediaTypeVideo preferredTrackID:kCMPersistentTrackID_Invalid];

  [composedTrack insertTimeRange:CMTimeRangeMake(kCMTimeZero, video1.duration)
                         ofTrack:[[video1 tracksWithMediaType:AVMediaTypeVideo] objectAtIndex:0]
                          atTime:kCMTimeZero error:nil];

  AVAssetExportSession *session = [[AVAssetExportSession alloc]initWithAsset:composition presetName:AVAssetExportPresetPassthrough];
  session.outputFileType = AVFileTypeMPEG4;

//  NSString *fileNameOut = @"lebrexports.mp4";
  NSString *fileNameOut = [NSString stringWithFormat:@"text_%@.mp4", fileName];
  NSString *directoryOut = @"Library/Caches/";
  NSString *outFile = [NSString stringWithFormat:@"%@%@", directoryOut, fileNameOut];
  NSString *exportPath = [NSHomeDirectory() stringByAppendingPathComponent:[NSString stringWithFormat:@"%@", outFile]];
  NSURL *exportUrl = [NSURL fileURLWithPath:exportPath];

//  NSString *documentsDirectory = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject];
//  NSURL *exportUrl = [NSURL fileURLWithPath:[documentsDirectory stringByAppendingPathComponent:@"exports.mp4"]];

  NSFileManager *fileManager = [NSFileManager defaultManager];
  [fileManager removeItemAtPath:[exportUrl path]  error:NULL];

  session.outputURL = exportUrl;

  CMTime half = CMTimeMultiplyByFloat64(session.asset.duration, 1);
  session.timeRange = CMTimeRangeMake(kCMTimeZero, half);
  NSLog(@"%@", session);

  [session exportAsynchronouslyWithCompletionHandler:^{
    switch (session.status) {
      case AVAssetExportSessionStatusFailed:
        NSLog(@"Export failed -> Reason: %@, User Info: %@",
              session.error.localizedDescription,
              session.error.userInfo.description);
        break;

      case AVAssetExportSessionStatusCancelled:
        NSLog(@"Export cancelled");
        break;

      case AVAssetExportSessionStatusCompleted: {
        NSLog(@"Export finished");
//        NSURL *videoTempURL = exportUrl;
//        [self saveMedia:videoTempURL];
        break;
      }
      case AVAssetExportSessionStatusUnknown:
        NSLog(@"Export Unknown");
        break;
      case AVAssetExportSessionStatusWaiting:
        NSLog(@"Export Waiting");
        break;
      case AVAssetExportSessionStatusExporting:
        NSLog(@"Export Exporting");
        break;
    }
  }];
}

+ (CVPixelBufferRef) pixelBufferFromCGImage:(CGImageRef)image size:(CGSize)size
{
  NSDictionary *options = [NSDictionary dictionaryWithObjectsAndKeys:
                           [NSNumber numberWithBool:YES], kCVPixelBufferCGImageCompatibilityKey,
                           [NSNumber numberWithBool:YES], kCVPixelBufferCGBitmapContextCompatibilityKey,
                           nil];
  CVPixelBufferRef pxbuffer = NULL;
  
  CVReturn status = CVPixelBufferCreate(kCFAllocatorDefault, size.width,
                                        size.height, kCVPixelFormatType_32ARGB, (__bridge CFDictionaryRef) options,
                                        &pxbuffer);
  
  NSParameterAssert(status == kCVReturnSuccess && pxbuffer != NULL);
  
  CVPixelBufferLockBaseAddress(pxbuffer, 0);
  void *pxdata = CVPixelBufferGetBaseAddress(pxbuffer);
  NSParameterAssert(pxdata != NULL);
  
  CGColorSpaceRef rgbColorSpace = CGColorSpaceCreateDeviceRGB();
  
  CGContextRef context = CGBitmapContextCreate(pxdata, size.width,
                                               size.height, 8, 4*size.width, rgbColorSpace,
                                               kCGImageAlphaNoneSkipFirst);
  NSParameterAssert(context);
  CGContextConcatCTM(context, CGAffineTransformMakeRotation(0));
  CGContextDrawImage(context, CGRectMake(0, 0, CGImageGetWidth(image),
                                         CGImageGetHeight(image)), image);
  CGColorSpaceRelease(rgbColorSpace);
  CGContextRelease(context);
  
  CVPixelBufferUnlockBaseAddress(pxbuffer, 0);
  
  return pxbuffer;
}

+ (void)saveMedia:(NSURL *)video_url {
  if (video_url) {
    if([video_url absoluteString].length < 1) {
      return;
    }
    
    NSLog(@"source will be : %@", video_url.absoluteString);
    NSURL *sourceURL = video_url;
    
    if([[NSFileManager defaultManager] fileExistsAtPath:[video_url absoluteString]]) {
      [PHAssetCreationRequest creationRequestForAssetFromVideoAtFileURL:video_url];
    } else {
      
      NSURLSessionTask *download = [[NSURLSession sharedSession] downloadTaskWithURL:sourceURL completionHandler:^(NSURL *location, NSURLResponse *response, NSError *error) {
        if(error) {
          NSLog(@"error saving: %@", error.localizedDescription);
          return;
        }
        
        NSURL *documentsURL = [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] firstObject];
        NSURL *tempURL = [documentsURL URLByAppendingPathComponent:[sourceURL lastPathComponent]];
        
        [[NSFileManager defaultManager] moveItemAtURL:location toURL:tempURL error:nil];
        
        PHAuthorizationStatus status = [PHPhotoLibrary authorizationStatus];
        
        if (status == PHAuthorizationStatusAuthorized) {
          [self writeToCameraRoll:tempURL];
        }
        else if (status == PHAuthorizationStatusDenied) {
          NSLog(@"access denied");
        }
        else if (status == PHAuthorizationStatusNotDetermined) {
          [PHPhotoLibrary requestAuthorization:^(PHAuthorizationStatus status) {
            if (status == PHAuthorizationStatusAuthorized) {
              [self writeToCameraRoll:tempURL];
            }
          }];
        }
        
      }];
      [download resume];
    }
  }
}

+ (void)writeToCameraRoll:(NSURL *)tempURL {
  [[PHPhotoLibrary sharedPhotoLibrary] performChanges:^{
    PHAssetChangeRequest *changeRequest = [PHAssetChangeRequest creationRequestForAssetFromVideoAtFileURL:tempURL];
    NSLog(@"%@", changeRequest.description);
  } completionHandler:^(BOOL success, NSError *error) {
    if (success) {
      NSLog(@"saved down");
      [[NSFileManager defaultManager] removeItemAtURL:tempURL error:nil];
    } else {
      NSLog(@"something wrong %@", error.localizedDescription);
      [[NSFileManager defaultManager] removeItemAtURL:tempURL error:nil];
    }
  }];
}

@end
