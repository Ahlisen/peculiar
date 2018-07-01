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

RCT_EXPORT_METHOD(generate:(NSString *)text) {
  RCTLogInfo(@"Recieving this: %@", text);
  NSLog(@"Recieving this: %@", text);
}
@end
