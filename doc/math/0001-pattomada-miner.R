#################################################################################
# PATTOMADA-0.1
# Proof of Distance Mining Algorithm (BT-GENESISBLOCK)
#
library("digest")
library("stringdist")
library("lsa")
work.hash <- "198332b46526431f0b51d0c2a9b728107328e59db18a0a889e8bc027871880a4"
work.hash.vector <- utf8ToInt(work.hash)
minimum.difficulty <- 1180197
random.numbers<-sample(1:100, 10, replace=T)
random.hashes<-sapply(X = random.numbers, FUN=digest, algo = "sha256")
random.vectors<-lapply(X = random.hashes, FUN=utf8ToInt)
minDifficultyShare <- minimum.difficulty / 5
example.amount<-1832447

#################################################################################
# FUNCTION: getDiff
# currentBlockTime -> The purposed or actual timestamp of the block following the previousBlock.
# previousBlockTime -> The seconds that elapsed 
# previousDifficulty -> the previous difficulty (distance) of the BC block
# handicap -> The target window size in seconds  
getDiff <- function(currentBlockTime = 0, previousBlockTime = 0, previousDifficulty = 0, handicap = 0, newBlocks = 0){
  elapsedTime <- currentBlockTime - previousBlockTime # Subtract the currenct time from the parent block time 
  elapsedTimeBonus <- elapsedTime + ((elapsedTime - 4) * newBlocks) # the "4" eventually should be the number of child chains - 1
  if(elapsedTimeBonus > 0){ # If a bonus rate is assigned override the accurate elapsedTime 
    elapsedTime = elapsedTimeBonus    
  }
  x = elapsedTime
  x = floor(x / handicap) # Accept a range e.g. 0-5 == 0, 6-11 == 1, 12-17 == 2
  x = 1 - x
  
  if(x < -99){ # Set minimum floor 
    x = -99
  }
  
  y = previousDifficulty / 148 # 148 = 74 * 2 or the maximum absolute distance of two characters converted from ASCII code. 
  
  x = x * y
  
  x = x + previousDifficulty
  
  if(x < minimum.difficulty) { # If below the minimum adjust. 
    x = minimum.difficulty
  } else {
    x
  }
}
#################################################################################
# TEST 1: Difficulty decreases linearly with fixed new Blocks
#################################################################################
results<-vector()
previousBlockTime <- 1000
for(n in (1:20)){
  d <- minDifficultyShare 
  currentBlockTime <- 1000 + n
  results[n]<-getDiff(currentBlockTime = currentBlockTime, previousBlockTime = previousBlockTime, previousDifficulty = example.amount, handicap = 6, newBlocks = 2)
}
plot(results, xlab = "Seconds After Parent Block", ylab = "Difficulty", main = "TEST 1A: Difficulty decreases seconds after parent")
#################################################################################
# TEST 2: Ordered addition of new blocks decreases difficulty
#################################################################################
results<-vector()
for(n in (1:20)){
  newB <- n + 2
  d <- minDifficultyShare 
  currentBlockTime <- 1000
  previousBlockTime <- 995
  results[n]<-getDiff(currentBlockTime = currentBlockTime, previousBlockTime = previousBlockTime, previousDifficulty = example.amount, handicap = 6, newBlocks = newB)
}
plot(results, xlab = "Seconds After Parent Block", ylab = "Difficulty", main="TEST 2: Ordered addition of new blocks decreases difficulty")
#################################################################################
# TEST 3: Variable second intervals, fixed new Blocks
#################################################################################
# Collect results with time bonus
result.a<-getDiff(currentBlockTime = 1000, previousBlockTime = 995, previousDifficulty = example.amount + 1000, handicap = 6, newBlocks = 1) 
result.b<-getDiff(currentBlockTime = 1000, previousBlockTime = 993, previousDifficulty = result.a, handicap = 6, newBlocks = 1)
result.c<-getDiff(currentBlockTime = 1000, previousBlockTime = 992, previousDifficulty = result.b, handicap = 6, newBlocks = 1)
result.d<-getDiff(currentBlockTime = 1000, previousBlockTime = 996, previousDifficulty = result.c, handicap = 6, newBlocks = 1)
result.e<-getDiff(currentBlockTime = 1000, previousBlockTime = 995, previousDifficulty = result.d, handicap = 6, newBlocks = 1)
results<-vector()
results[1]<-result.a
results[2]<-result.b
results[3]<-result.c
results[4]<-result.d
results[5]<-result.e
plot(results, type="b", main = "TEST 2: Variable second intervals, fixed new Blocks")
#################################################################################
# TEST 4: Fixed 5 second intervals with variable new Blocks counts
#################################################################################
test<-vector()
test[1]<-getDiff(currentBlockTime = 1000, previousBlockTime = 995, previousDifficulty = example.amount + 1000, handicap = 6, newBlocks = 4)
test[2]<-getDiff(currentBlockTime = 1000, previousBlockTime = 995, previousDifficulty = example.amount + 1000, handicap = 6, newBlocks = 14)
test[3]<-getDiff(currentBlockTime = 1000, previousBlockTime = 995, previousDifficulty = example.amount + 1000, handicap = 6, newBlocks = 2) 
test[4]<-getDiff(currentBlockTime = 1000, previousBlockTime = 995, previousDifficulty = example.amount + 1000, handicap = 6, newBlocks = 2) 
test[5]<-getDiff(currentBlockTime = 1000, previousBlockTime = 995, previousDifficulty = example.amount + 1000, handicap = 6, newBlocks = 1) 
test[6]<-getDiff(currentBlockTime = 1000, previousBlockTime = 995, previousDifficulty = example.amount + 1000, handicap = 6, newBlocks = 1) 
test[7]<-getDiff(currentBlockTime = 1000, previousBlockTime = 995, previousDifficulty = example.amount + 1000, handicap = 6, newBlocks = 3) 
test[8]<-getDiff(currentBlockTime = 1000, previousBlockTime = 995, previousDifficulty = example.amount + 1000, handicap = 6, newBlocks = 3) 
plot(results, ylab="Difficulty Threshold", type="b", xlab="Index", main = "TEST 4: Fixed 5 second intervals with variable new Blocks")
#################################################################################
# TEST 5: Variable second intervals and new blocks
#################################################################################
result.a<-getDiff(currentBlockTime = 1000, previousBlockTime = 995, previousDifficulty = example.amount + 1000, handicap = 6, newBlocks = 1) 
result.b<-getDiff(currentBlockTime = 1000, previousBlockTime = 996, previousDifficulty = result.a, handicap = 6, newBlocks = 1)
result.c<-getDiff(currentBlockTime = 1000, previousBlockTime = 996, previousDifficulty = result.b, handicap = 6, newBlocks = 4)
result.d<-getDiff(currentBlockTime = 1000, previousBlockTime = 997, previousDifficulty = result.c, handicap = 6, newBlocks = 1)
result.e<-getDiff(currentBlockTime = 1000, previousBlockTime = 993, previousDifficulty = result.d, handicap = 6, newBlocks = 3)
results<-vector()
results[1]<-result.a
results[2]<-result.b
results[3]<-result.c
results[4]<-result.d
results[5]<-result.e
plot(results, type="b", ylab="Difficulty Threshold", xlab="Index", main = "TEST 5: Variable second intervals and new blocks")
