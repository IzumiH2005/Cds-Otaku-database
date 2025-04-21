import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import FlashCard from "@/components/FlashCard";
import { getDeck, getFlashcardsByDeck, Flashcard, getThemesByDeck } from "@/lib/localStorage";
import { recordCardStudy, updateSessionStats } from "@/lib/sessionManager";
import { ArrowLeft, ArrowRight, Check, X, Shuffle, ThumbsUp, ThumbsDown, Lightbulb, MessageSquare, Repeat } from "lucide-react";
import { evaluateAnswer } from "@/services/geminiService";

enum StudyMode {
  FLASHCARDS = "flashcards",
  QUIZ = "quiz",
  WRITE = "write",
}

enum QuizCheckMethod {
  MANUAL = "manual",
  AUTO = "auto",
}

const StudyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [studyMode, setStudyMode] = useState<StudyMode>(StudyMode.FLASHCARDS);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [filteredCards, setFilteredCards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [deck, setDeck] = useState<any>(null);
  const [studyTheme, setStudyTheme] = useState<string>("all");
  const [shuffle, setShuffle] = useState(false);
  const [themes, setThemes] = useState<any[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: string }>({});
  const [quizResults, setQuizResults] = useState<{ [key: string]: boolean }>({});
  const [quizCheckMethod, setQuizCheckMethod] = useState<QuizCheckMethod>(QuizCheckMethod.MANUAL);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini-api-key') || '';
  });
  const [isGeminiEnabled, setIsGeminiEnabled] = useState<boolean>(() => {
    return !!localStorage.getItem('gemini-api-key');
  });
  const [apiChecking, setApiChecking] = useState(false);
  const [studyStartTime] = useState(new Date());
  const answerInputRef = useRef<HTMLInputElement>(null);
  const geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

  useEffect(() => {
    if (!id) return;

    try {
      const deckData = getDeck(id);
      if (!deckData) {
        toast({
          title: "Deck introuvable",
          description: "Le deck demandé n'existe pas",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      setDeck(deckData);

      const deckCards = getFlashcardsByDeck(id);
      setCards(deckCards);

      const deckThemes = getThemesByDeck(id);
      setThemes(deckThemes);

      setFilteredCards(shuffle ? shuffleArray([...deckCards]) : [...deckCards]);

      updateSessionStats({
        studySessions: 1,
        lastStudyDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error loading study data:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données du deck",
        variant: "destructive",
      });
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    if (!cards.length) return;

    let filtered = [...cards];

    if (studyTheme !== "all") {
      filtered = filtered.filter(card => card.themeId === studyTheme);
    }

    if (shuffle) {
      filtered = shuffleArray(filtered);
    }

    setFilteredCards(filtered);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
    setShowHint(false);
    setQuizAnswers({});
    setQuizResults({});
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setShowResults(false);
  }, [studyTheme, shuffle, cards]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleNextCard = () => {
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowAnswer(false);
      setShowHint(false);
    } else {
      if (studyMode === StudyMode.FLASHCARDS) {
        recordStudySession();
        toast({
          title: "Bravo !",
          description: "Vous avez terminé toutes les cartes de ce deck.",
        });
      }
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
      setShowAnswer(false);
      setShowHint(false);
    }
  };

  const handleCardFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      recordCardStudy(true);
    }
  };

  const handleThemeChange = (value: string) => {
    setStudyTheme(value);
  };

  const handleShuffleToggle = () => {
    setShuffle(!shuffle);
  };

  const handleStudyModeChange = (mode: StudyMode) => {
    setStudyMode(mode);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
    setShowHint(false);
    setQuizAnswers({});
    setQuizResults({});
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setShowResults(false);
  };

  const handleQuizAnswer = (e: React.ChangeEvent<HTMLInputElement>, cardId: string) => {
    setQuizAnswers({
      ...quizAnswers,
      [cardId]: e.target.value
    });
  };

  const checkAnswerWithGemini = async (userAnswer: string, correctAnswer: string, cardId: string) => {
    if (!geminiApiKey || !isGeminiEnabled) {
      toast({
        title: "API Gemini non configurée",
        description: "Veuillez configurer l'API Gemini pour la vérification automatique",
        variant: "destructive",
      });
      return false;
    }

    setApiChecking(true);

    try {
      // Use the evaluateAnswer function from the geminiService
      const { score, feedback } = await evaluateAnswer(userAnswer, correctAnswer);
      
      const isCorrect = score >= 0.7; // Consider 70% match as correct
      
      setQuizResults({
        ...quizResults,
        [cardId]: isCorrect
      });
      
      if (isCorrect) {
        setCorrectAnswers(prev => prev + 1);
        recordCardStudy(true);
        toast({
          title: "Correct!",
          description: feedback,
          variant: "default",
        });
      } else {
        setIncorrectAnswers(prev => prev + 1);
        recordCardStudy(false);
        toast({
          title: "Incorrect",
          description: feedback,
          variant: "destructive",
        });
      }
      
      return isCorrect;
    } catch (error) {
      console.error("Error checking answer with Gemini:", error);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier la réponse avec l'API Gemini. Vérifiez votre clé API et réessayez.",
        variant: "destructive",
      });
      return null;
    } finally {
      setApiChecking(false);
    }
  };

  const handleManualCheck = (cardId: string, isCorrect: boolean) => {
    setQuizResults({
      ...quizResults,
      [cardId]: isCorrect
    });
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      recordCardStudy(true);
    } else {
      setIncorrectAnswers(prev => prev + 1);
      recordCardStudy(false);
    }
    
    if (currentCardIndex < filteredCards.length - 1) {
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1);
        if (answerInputRef.current) {
          answerInputRef.current.focus();
        }
      }, 1000);
    } else {
      recordStudySession();
      setShowResults(true);
    }
  };

  const handleAutoCheck = async (cardId: string) => {
    const userAnswer = quizAnswers[cardId] || '';
    const correctAnswer = filteredCards[currentCardIndex].back.text;
    
    if (!userAnswer.trim()) {
      toast({
        title: "Réponse vide",
        description: "Veuillez entrer une réponse avant de vérifier",
        variant: "default",
      });
      return;
    }
    
    if (isGeminiEnabled) {
      const result = await checkAnswerWithGemini(userAnswer, correctAnswer, cardId);
      
      if (result !== null && currentCardIndex < filteredCards.length - 1) {
        setTimeout(() => {
          setCurrentCardIndex(prev => prev + 1);
          if (answerInputRef.current) {
            answerInputRef.current.focus();
          }
        }, 1000);
      } else if (result !== null && currentCardIndex === filteredCards.length - 1) {
        recordStudySession();
        setShowResults(true);
      }
    } else {
      const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      handleManualCheck(cardId, isCorrect);
    }
  };

  const recordStudySession = () => {
    try {
      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - studyStartTime.getTime()) / (1000 * 60));
      
      updateSessionStats({
        totalStudyTime: durationMinutes,
        lastStudyDate: new Date().toISOString(),
      });
      
      console.log(`Study session recorded: ${durationMinutes} minutes`);
    } catch (error) {
      console.error("Error recording study session:", error);
    }
  };

  const restartStudy = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setShowAnswer(false);
    setShowHint(false);
    setQuizAnswers({});
    setQuizResults({});
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setShowResults(false);
    
    if (shuffle) {
      setFilteredCards(shuffleArray([...filteredCards]));
    }
  };

  useEffect(() => {
    if (geminiApiKey) {
      localStorage.setItem('gemini-api-key', geminiApiKey);
      setIsGeminiEnabled(true);
      toast({
        title: "API Gemini configurée",
        description: "Vous pouvez maintenant utiliser la vérification automatique",
        variant: "default",
      });
    } else {
      localStorage.removeItem('gemini-api-key');
      setIsGeminiEnabled(false);
    }
  }, [geminiApiKey, toast]);

  if (!deck || filteredCards.length === 0) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Étudier le deck</h1>
        {!deck ? (
          <p>Chargement du deck...</p>
        ) : (
          <div className="max-w-md mx-auto">
            <Alert className="mb-4">
              <AlertTitle>Aucune carte disponible</AlertTitle>
              <AlertDescription>
                {studyTheme !== "all"
                  ? "Il n'y a pas de cartes dans ce thème. Veuillez sélectionner un autre thème ou ajouter des cartes."
                  : "Ce deck ne contient aucune carte. Veuillez ajouter des cartes avant d'étudier."}
              </AlertDescription>
            </Alert>
            <Button onClick={() => navigate(`/deck/${id}`)}>
              Retour au deck
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col mb-6 sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{deck.title}</h1>
            <p className="text-muted-foreground">
              Carte {currentCardIndex + 1} sur {filteredCards.length}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleShuffleToggle}
              className={shuffle ? "bg-primary/10" : ""}
            >
              <Shuffle className={`mr-2 h-4 w-4 ${shuffle ? "text-primary" : ""}`} />
              {shuffle ? "Mélangé" : "Mélanger"}
            </Button>
            
            {themes.length > 0 && (
              <Select value={studyTheme} onValueChange={handleThemeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sélectionner un thème" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les thèmes</SelectItem>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      {theme.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <Tabs defaultValue={studyMode} onValueChange={(value) => handleStudyModeChange(value as StudyMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value={StudyMode.FLASHCARDS}>Flashcards</TabsTrigger>
                <TabsTrigger value={StudyMode.QUIZ}>Quiz</TabsTrigger>
                <TabsTrigger value={StudyMode.WRITE}>Écriture</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {studyMode === StudyMode.FLASHCARDS && (
              <div className="flex justify-center">
                {filteredCards.length > 0 && (
                  <div className="w-full max-w-xl" onClick={handleCardFlip}>
                    <FlashCard
                      id={filteredCards[currentCardIndex].id}
                      front={filteredCards[currentCardIndex].front}
                      back={filteredCards[currentCardIndex].back}
                      onCardFlip={() => {}}
                      className={isFlipped ? "flipped" : ""}
                    />
                  </div>
                )}
              </div>
            )}
            
            {studyMode === StudyMode.QUIZ && !showResults && (
              <div className="space-y-6">
                <div className="flex items-center justify-center mb-4">
                  <Progress value={(currentCardIndex / filteredCards.length) * 100} className="w-full" />
                </div>
                
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold mb-4">{filteredCards[currentCardIndex].front.text}</h2>
                  
                  {filteredCards[currentCardIndex].front.image && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={filteredCards[currentCardIndex].front.image}
                        alt="Question"
                        className="max-h-60 rounded-lg"
                      />
                    </div>
                  )}
                  
                  {showHint && (
                    <Alert className="mt-4 bg-yellow-50 dark:bg-yellow-900/20">
                      <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <AlertTitle>Indice</AlertTitle>
                      <AlertDescription className="italic">
                        {filteredCards[currentCardIndex].front.additionalInfo || "Aucun indice disponible"}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="answer">Votre réponse</Label>
                    <div className="flex gap-2">
                      <Input
                        ref={answerInputRef}
                        id="answer"
                        value={quizAnswers[filteredCards[currentCardIndex].id] || ''}
                        onChange={(e) => handleQuizAnswer(e, filteredCards[currentCardIndex].id)}
                        className="flex-1"
                        placeholder="Entrez votre réponse..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAutoCheck(filteredCards[currentCardIndex].id);
                          }
                        }}
                      />
                      
                      <Button onClick={() => setShowHint(!showHint)} variant="outline" className="shrink-0">
                        <Lightbulb className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {quizCheckMethod === QuizCheckMethod.AUTO ? (
                    <Button 
                      onClick={() => handleAutoCheck(filteredCards[currentCardIndex].id)}
                      className="w-full"
                      disabled={apiChecking}
                    >
                      {apiChecking ? "Vérification..." : "Vérifier ma réponse"}
                    </Button>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2 mb-4">
                        <Button
                          onClick={() => setShowAnswer(!showAnswer)}
                          variant="outline"
                          size="sm"
                        >
                          {showAnswer ? "Masquer la réponse" : "Afficher la réponse"}
                        </Button>
                      </div>
                      
                      {showAnswer && (
                        <div className="p-4 border rounded-lg bg-secondary/10">
                          <p className="font-medium">Réponse correcte:</p>
                          <p className="mt-1">{filteredCards[currentCardIndex].back.text}</p>
                          {filteredCards[currentCardIndex].back.image && (
                            <div className="mt-2">
                              <img
                                src={filteredCards[currentCardIndex].back.image}
                                alt="Answer"
                                className="max-h-40 mx-auto rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-center gap-2 mt-4">
                        <Button 
                          onClick={() => handleManualCheck(filteredCards[currentCardIndex].id, false)}
                          variant="outline"
                          className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-950"
                        >
                          <ThumbsDown className="mr-2 h-4 w-4" />
                          Incorrect
                        </Button>
                        
                        <Button 
                          onClick={() => handleManualCheck(filteredCards[currentCardIndex].id, true)}
                          variant="outline"
                          className="flex-1 border-green-200 hover:bg-green-50 hover:text-green-600 dark:border-green-800 dark:hover:bg-green-950"
                        >
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          Correct
                        </Button>
                      </div>
                    </>
                  )}
                  
                  {quizResults[filteredCards[currentCardIndex].id] !== undefined && (
                    <div className={`p-4 mt-2 border rounded-lg ${
                      quizResults[filteredCards[currentCardIndex].id] 
                        ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300" 
                        : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                    }`}>
                      <div className="flex items-center">
                        {quizResults[filteredCards[currentCardIndex].id] ? (
                          <>
                            <Check className="h-5 w-5 mr-2" />
                            <span>Correct !</span>
                          </>
                        ) : (
                          <>
                            <X className="h-5 w-5 mr-2" />
                            <span>Incorrect. La bonne réponse est: {filteredCards[currentCardIndex].back.text}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {studyMode === StudyMode.WRITE && !showResults && (
              <div className="space-y-6">
                <div className="flex items-center justify-center mb-4">
                  <Progress value={(currentCardIndex / filteredCards.length) * 100} className="w-full" />
                </div>
                
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold mb-4">{filteredCards[currentCardIndex].front.text}</h2>
                  
                  {filteredCards[currentCardIndex].front.image && (
                    <div className="flex justify-center mb-4">
                      <img
                        src={filteredCards[currentCardIndex].front.image}
                        alt="Question"
                        className="max-h-60 rounded-lg"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="writeAnswer">Écrivez votre réponse</Label>
                    <textarea
                      id="writeAnswer"
                      className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background"
                      value={quizAnswers[filteredCards[currentCardIndex].id] || ''}
                      onChange={(e) => handleQuizAnswer(e as any, filteredCards[currentCardIndex].id)}
                      placeholder="Écrivez votre réponse ici..."
                    />
                  </div>
                  
                  <div className="flex justify-between">
                    <Button
                      onClick={() => setShowHint(!showHint)}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Lightbulb className="h-4 w-4" />
                      Indice
                    </Button>
                    
                    <Button
                      onClick={() => setShowAnswer(!showAnswer)}
                      variant="outline"
                    >
                      {showAnswer ? "Masquer la réponse" : "Afficher la réponse"}
                    </Button>
                  </div>
                  
                  {showHint && (
                    <Alert className="mt-2 bg-yellow-50 dark:bg-yellow-900/20">
                      <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <AlertTitle>Indice</AlertTitle>
                      <AlertDescription className="italic">
                        {filteredCards[currentCardIndex].front.additionalInfo || "Aucun indice disponible"}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {showAnswer && (
                    <div className="p-4 border rounded-lg bg-secondary/10 mt-2">
                      <p className="font-medium">Réponse correcte:</p>
                      <p className="mt-1">{filteredCards[currentCardIndex].back.text}</p>
                      {filteredCards[currentCardIndex].back.image && (
                        <div className="mt-2">
                          <img
                            src={filteredCards[currentCardIndex].back.image}
                            alt="Answer"
                            className="max-h-40 mx-auto rounded-lg"
                          />
                        </div>
                      )}
                      {filteredCards[currentCardIndex].back.additionalInfo && (
                        <div className="mt-2 p-2 bg-primary/5 rounded text-sm">
                          <p className="font-medium">Informations supplémentaires:</p>
                          <p>{filteredCards[currentCardIndex].back.additionalInfo}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-center gap-2 mt-4">
                    <Button 
                      onClick={() => handleManualCheck(filteredCards[currentCardIndex].id, false)}
                      variant="outline"
                      className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-950"
                    >
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      Incorrect
                    </Button>
                    
                    <Button 
                      onClick={() => handleManualCheck(filteredCards[currentCardIndex].id, true)}
                      variant="outline"
                      className="flex-1 border-green-200 hover:bg-green-50 hover:text-green-600 dark:border-green-800 dark:hover:bg-green-950"
                    >
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Correct
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {showResults && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">Résultats</h2>
                  <p className="text-muted-foreground mb-6">
                    Vous avez terminé l'étude de {filteredCards.length} cartes
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-6">
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-sm text-muted-foreground">Réponses correctes</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">{correctAnswers}</p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <p className="text-sm text-muted-foreground">Réponses incorrectes</p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">{incorrectAnswers}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-w-md mx-auto mb-6">
                    <div className="flex justify-between items-center">
                      <Label>Performance</Label>
                      <Badge variant="outline">
                        {Math.round((correctAnswers / (correctAnswers + incorrectAnswers)) * 100) || 0}%
                      </Badge>
                    </div>
                    <Progress 
                      value={
                        correctAnswers + incorrectAnswers > 0
                          ? (correctAnswers / (correctAnswers + incorrectAnswers)) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                  
                  <Button onClick={restartStudy} className="mx-2">
                    <Repeat className="mr-2 h-4 w-4" />
                    Recommencer
                  </Button>
                  
                  <Button onClick={() => navigate(`/deck/${id}`)} variant="outline" className="mx-2">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour au deck
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
          
          {studyMode === StudyMode.QUIZ && !showResults && (
            <CardFooter className="flex flex-col gap-4">
              <div className="w-full border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="quiz-check-method">
                    Méthode de vérification:
                  </Label>
                  <Select
                    value={quizCheckMethod}
                    onValueChange={(value) => setQuizCheckMethod(value as QuizCheckMethod)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={QuizCheckMethod.MANUAL}>Manuelle</SelectItem>
                      <SelectItem value={QuizCheckMethod.AUTO}>Automatique (API)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {quizCheckMethod === QuizCheckMethod.AUTO && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="api-key">Clé API Gemini</Label>
                      <Input
                        id="api-key"
                        type="password"
                        value={geminiApiKey}
                        placeholder="Entrez votre clé API Gemini-1.5-flash"
                        onChange={(e) => setGeminiApiKey(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enable-gemini"
                        checked={isGeminiEnabled}
                        onCheckedChange={setIsGeminiEnabled}
                      />
                      <Label htmlFor="enable-gemini">
                        Activer la vérification automatique avec Gemini
                      </Label>
                    </div>
                    {!isGeminiEnabled && (
                      <p className="text-xs text-muted-foreground">
                        La vérification automatique utilisera une correspondance exacte sans l'API Gemini.
                      </p>
                    )}
                    <Alert className="mt-2 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                      <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertTitle>Note sur l'API Gemini</AlertTitle>
                      <AlertDescription className="text-xs">
                        Utilisez une clé API pour Gemini 1.5 Flash. Vous pouvez l'obtenir sur 
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" 
                           className="underline text-blue-600 dark:text-blue-400 ml-1">
                          Google AI Studio
                        </a>.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </CardFooter>
          )}
        </Card>
        
        {(studyMode === StudyMode.FLASHCARDS && !showResults) && (
          <div className="flex justify-between">
            <Button
              onClick={handlePrevCard}
              disabled={currentCardIndex === 0}
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            
            <Button
              onClick={handleCardFlip}
              variant="outline"
            >
              Retourner
            </Button>
            
            <Button
              onClick={handleNextCard}
              disabled={currentCardIndex === filteredCards.length - 1}
            >
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPage;
