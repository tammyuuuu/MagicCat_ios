"""Measured Chinese wrapping: one line, then semantic pauses, then word boundaries."""
from pathlib import Path
import sys,re
sys.path.insert(0,str(Path(__file__).resolve().parent/'.text-deps'))
import jieba
jieba.setLogLevel(40)
jieba.dt.tmp_dir=str(Path(__file__).resolve().parent/'.text-deps')
def chinese_wrap(text,font,width):
 if font.getlength(text)<=width:return [text]
 words=list(jieba.cut(text,HMM=False));positions=[];n=0
 for word in words:
  n+=len(word);positions.append(n)
 punctuation='，；：。！？、'
 boundaries=[0]+[p for p in positions if p==len(text) or text[p] not in punctuation+'”’」』）》】']
 # DP favors fewer lines, semantic stops, then balanced actual widths.
 best={0:(0,[])}
 for end in boundaries[1:]:
  choices=[]
  for start,(cost,lines) in best.items():
   line=text[start:end];w=font.getlength(line)
   if w>width:continue
   penalty=0 if end==len(text) or text[end-1] in punctuation else 1000
   choices.append((cost+10000+penalty+((width-w)/width)**2*100,lines+[line]))
  if choices:best[end]=min(choices,key=lambda x:x[0])
 if len(text) not in best:raise ValueError('A word exceeds available width')
 result=best[len(text)][1]
 assert ''.join(result)==text
 return result
