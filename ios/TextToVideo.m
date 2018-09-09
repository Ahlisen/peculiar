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

RCT_EXPORT_METHOD(generateAsync:(NSString *)text:(NSString *)index resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  RCTLogInfo(@"Recieving: %@", text);
  NSLog(@"Recieving: %@", text);
  
  [TextToVideo videoFromString:text size:CGSizeMake(768.0, 768.0) fileName:index resolver:resolve rejecter:reject];
}

+ (UIImage *)imageFromString:(NSString *)input size:(CGSize)size {
  NSMutableParagraphStyle* style = [[NSMutableParagraphStyle alloc] init];
  [style setAlignment:NSTextAlignmentCenter];
  CGFloat fontSize = 128 - [input length];
  NSDictionary *attributes = @{ NSForegroundColorAttributeName: UIColor.blackColor, NSFontAttributeName: [UIFont fontWithName:@"Rubik-Medium" size:fontSize], NSParagraphStyleAttributeName: style };
  
  UIGraphicsBeginImageContext(size);
  CGContextRef context = UIGraphicsGetCurrentContext();
  [[UIColor whiteColor] setFill];
  CGContextFillRect(context, CGRectMake(0, 0, size.width, size.height));
  
  [input drawInRect:CGRectMake(50, size.height/3, size.width-100, size.height) withAttributes:attributes];
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();
  
  return image;
}

+ (void)videoFromString:(NSString *)input size:(CGSize)size fileName:(NSString *)fileName resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject
{
  // You can save a .mov or a .mp4 file
  NSString *fileNameOut = [NSString stringWithFormat:@"temp_%@.mp4", fileName];
  
  // We chose to save in the tmp/ directory on the device initially
  NSString *directoryOut = @"Library/Caches/";
  NSString *outFile = [NSString stringWithFormat:@"%@%@", directoryOut, fileNameOut];
  NSString *path = [NSHomeDirectory() stringByAppendingPathComponent:[NSString stringWithFormat:@"%@", outFile]];
  NSURL *videoTempURL = [NSURL fileURLWithPath:path];

  // WARNING: AVAssetWriter does not overwrite files for us, so remove the destination file if it already exists
  NSFileManager *fileManager = [NSFileManager defaultManager];
  [fileManager removeItemAtPath:[videoTempURL path]  error:NULL];
  
  // Create your own array of UIImages
  NSMutableArray *images = [NSMutableArray array];
  NSUInteger videoLength = ([input length] / 2) + 2;
  for (int i=0; i<videoLength; i++) {
    NSString *text = [NSString stringWithFormat:@"%@", input];
    UIImage *image = [self imageFromString:text size:size];
    [images addObject:image];
  }

  NSError *error = nil;
  
  // FIRST, start up an AVAssetWriter instance to write your video
  // Give it a destination path (for us: tmp/temp.mov)
  AVAssetWriter *videoWriter = [[AVAssetWriter alloc] initWithURL:[NSURL fileURLWithPath:path] fileType:AVFileTypeMPEG4 error:&error];
  
  NSParameterAssert(videoWriter);

  NSDictionary *videoSettings;

  if (@available(iOS 11.0, *)) {
    videoSettings = [NSDictionary dictionaryWithObjectsAndKeys:
                     AVVideoCodecTypeH264, AVVideoCodecKey,
                     [NSNumber numberWithInt:size.width], AVVideoWidthKey,
                     [NSNumber numberWithInt:size.height], AVVideoHeightKey,
                     nil];
  } else {
    videoSettings = [NSDictionary dictionaryWithObjectsAndKeys:
                     AVVideoCodecH264, AVVideoCodecKey,
                     [NSNumber numberWithInt:size.width], AVVideoWidthKey,
                     [NSNumber numberWithInt:size.height], AVVideoHeightKey,
                     nil];
  }

  AVAssetWriterInput* writerInput = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo
                                                                       outputSettings:videoSettings];
  
  AVAssetWriterInputPixelBufferAdaptor *adaptor = [AVAssetWriterInputPixelBufferAdaptor assetWriterInputPixelBufferAdaptorWithAssetWriterInput:writerInput
                                                                                                                   sourcePixelBufferAttributes:nil];
  NSParameterAssert(writerInput);
  NSParameterAssert([videoWriter canAddInput:writerInput]);
  [videoWriter addInput:writerInput];
  //Start a SESSION of writing.
  [videoWriter startWriting];
  // This starts your video at time = 0
  [videoWriter startSessionAtSourceTime:kCMTimeZero];
  
  CVPixelBufferRef buffer = NULL;
  
  int i = 0;
  while (1)
  {
    // Check if the writer is ready for more data, if not, just wait
    if(writerInput.readyForMoreMediaData){
      
      CMTime frameTime = CMTimeMake(75, 600);
      // CMTime = Value and Timescale.
      // Timescale = the number of tics per second you want
      // Value is the number of tics
      // For us - each frame we add will be 1/4th of a second
      // Apple recommend 600 tics per second for video because it is a
      // multiple of the standard video rates 24, 30, 60 fps etc.
      CMTime lastTime=CMTimeMake(i*75, 600);
      CMTime presentTime=CMTimeAdd(lastTime, frameTime);
      
      if (i == 0) {presentTime = CMTimeMake(0, 600);}
      // This ensures the first frame starts at 0.
      
      if (i >= [images count])
      {
        buffer = NULL;
      }
      else
      {
        // This command grabs the next UIImage and converts it to a CGImage
        buffer = [self pixelBufferFromCGImage:[[images objectAtIndex:i] CGImage] size:size];
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
            [TextToVideo addAudio:path fileName:fileName resolver:resolve rejecter:reject];
          } else
          {
            NSLog(@"Video writing failed: %@", videoWriter.error);
          }
        }]; // end videoWriter finishWriting Block
        
        CVPixelBufferPoolRelease(adaptor.pixelBufferPool);
        
        NSLog (@"Done");
        break;
      }
    }
  }
}

+ (void) addAudio:(NSString *)path fileName:(NSString *)fileName resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject
{
  AVMutableComposition* composition = [[AVMutableComposition alloc]init];
  AVURLAsset* videoAsset = [[AVURLAsset alloc]initWithURL:[NSURL fileURLWithPath:path]options:nil];
  AVAssetTrack *videoAssetTrack = [[videoAsset tracksWithMediaType:AVMediaTypeVideo] objectAtIndex:0];
  CMTimeRange timeRange = CMTimeRangeMake(kCMTimeZero, videoAssetTrack.timeRange.duration);

  NSString * audioPath = [[NSBundle mainBundle] pathForResource:@"plopp4sec" ofType:@"m4a"];
  AVAsset *audioAsset = [AVAsset assetWithURL:[NSURL fileURLWithPath:audioPath]];

  //Create mutable composition of audio type
  AVMutableCompositionTrack *audioTrack = [composition addMutableTrackWithMediaType:AVMediaTypeAudio preferredTrackID:kCMPersistentTrackID_Invalid];

  [audioTrack insertTimeRange:timeRange
                      ofTrack:[[audioAsset tracksWithMediaType:AVMediaTypeAudio] objectAtIndex:0] atTime:kCMTimeZero error:nil];

  AVMutableCompositionTrack* composedTrack = [composition addMutableTrackWithMediaType:AVMediaTypeVideo preferredTrackID:kCMPersistentTrackID_Invalid];

  [composedTrack insertTimeRange:timeRange
                         ofTrack:[[videoAsset tracksWithMediaType:AVMediaTypeVideo] objectAtIndex:0]
                          atTime:kCMTimeZero error:nil];

  AVAssetExportSession *session = [[AVAssetExportSession alloc]initWithAsset:composition presetName:AVAssetExportPresetMediumQuality];
  session.outputFileType = AVFileTypeMPEG4;

  NSString *fileNameOut = [NSString stringWithFormat:@"text_%@.mp4", fileName];
  NSString *directoryOut = @"Library/Caches/";
  NSString *outFile = [NSString stringWithFormat:@"%@%@", directoryOut, fileNameOut];
  NSString *exportPath = [NSHomeDirectory() stringByAppendingPathComponent:[NSString stringWithFormat:@"%@", outFile]];
  NSURL *exportUrl = [NSURL fileURLWithPath:exportPath];

  NSFileManager *fileManager = [NSFileManager defaultManager];
  [fileManager removeItemAtPath:[exportUrl path]  error:NULL];

  session.outputURL = exportUrl;
  session.timeRange = timeRange;

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
        resolve(exportPath);
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

@end
