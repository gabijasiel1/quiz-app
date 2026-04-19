import React, { useMemo, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ButtonGroup } from "@rneui/themed";

const Stack = createNativeStackNavigator();

// Correct answers:
// 1) 7 days -> index 1
// 2) Blue is a primary color -> index 0 (True)
// 3) Continents -> indexes 0, 1, 3
// 4) 5 + 3 = 8 -> index 2
const QUESTIONS = [
  {
    prompt: "How many days are in one week?",
    type: "multiple-choice",
    choices: ["5", "7", "8", "10"],
    correct: 1,
  },
  {
    prompt: "Blue is a primary color.",
    type: "true-false",
    choices: ["True", "False"],
    correct: 0,
  },
  {
    prompt: "Which of these are continents?",
    type: "multiple-answer",
    choices: ["Asia", "Africa", "Pacific Ocean", "Europe"],
    correct: [0, 1, 3],
  },
  {
    prompt: "What is 5 + 3?",
    type: "multiple-choice",
    choices: ["6", "7", "8", "9"],
    correct: 2,
  },
];

const isArrayAnswerCorrect = (selected = [], correct = []) => {
  if (selected.length !== correct.length) {
    return false;
  }

  const sortedSelected = [...selected].sort((a, b) => a - b);
  const sortedCorrect = [...correct].sort((a, b) => a - b);

  return sortedSelected.every((value, index) => value === sortedCorrect[index]);
};

const isQuestionCorrect = (question, answer) => {
  if (question.type === "multiple-answer") {
    return isArrayAnswerCorrect(answer, question.correct);
  }

  return answer === question.correct;
};

const getCorrectChoices = (question) => {
  const correctIndexes = Array.isArray(question.correct)
    ? question.correct
    : [question.correct];

  return correctIndexes.map((index) => question.choices[index]).join(", ");
};

export function Question({ navigation, route }) {
  const { data, index, answers = [] } = route.params;
  const question = data[index];
  const isMultipleAnswer = question.type === "multiple-answer";
  const [selectedAnswer, setSelectedAnswer] = useState(
    isMultipleAnswer ? [] : null
  );

  const nextLabel =
    index === data.length - 1 ? "See Summary" : "Next Question";

  const handleChoicePress = (selectedIndex) => {
    if (isMultipleAnswer) {
      setSelectedAnswer((current) =>
        current.includes(selectedIndex)
          ? current.filter((item) => item !== selectedIndex)
          : [...current, selectedIndex]
      );
      return;
    }

    setSelectedAnswer(selectedIndex);
  };

  const handleNext = () => {
    const updatedAnswers = [...answers];
    updatedAnswers[index] = selectedAnswer;

    if (index === data.length - 1) {
      navigation.replace("Summary", {
        data,
        answers: updatedAnswers,
      });
      return;
    }

    navigation.replace("Question", {
      data,
      index: index + 1,
      answers: updatedAnswers,
    });
  };

  const isSelectionEmpty = isMultipleAnswer
    ? selectedAnswer.length === 0
    : selectedAnswer === null;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.card}>
        <Text style={styles.stepText}>
          Question {index + 1} of {data.length}
        </Text>
        <Text style={styles.typeText}>{question.type.replace("-", " ")}</Text>
        <Text style={styles.questionText}>{question.prompt}</Text>

        <ButtonGroup
          buttons={question.choices}
          onPress={handleChoicePress}
          selectedIndex={isMultipleAnswer ? undefined : selectedAnswer}
          selectedIndexes={isMultipleAnswer ? selectedAnswer : undefined}
          vertical
          multiSelect={isMultipleAnswer}
          testID="choices"
          containerStyle={styles.choiceGroup}
          buttonStyle={styles.choiceButton}
          selectedButtonStyle={styles.selectedChoiceButton}
          textStyle={styles.choiceText}
          selectedTextStyle={styles.selectedChoiceText}
        />

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isSelectionEmpty}
          onPress={handleNext}
          style={[
            styles.nextButton,
            isSelectionEmpty && styles.nextButtonDisabled,
          ]}
          testID="next-question"
        >
          <Text style={styles.nextButtonText}>{nextLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export function Summary({ route, navigation }) {
  const { data, answers = [] } = route.params;

  const total = useMemo(() => {
    return data.reduce((score, question, index) => {
      return isQuestionCorrect(question, answers[index]) ? score + 1 : score;
    }, 0);
  }, [answers, data]);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.summaryTitle}>Quiz Summary</Text>
          <Text style={styles.totalText} testID="total">
            Total Score: {total}/{data.length}
          </Text>

          {data.map((question, questionIndex) => {
            const answer = answers[questionIndex];
            const isCorrect = isQuestionCorrect(question, answer);
            const chosenIndexes = Array.isArray(answer)
              ? answer
              : answer !== null && answer !== undefined
              ? [answer]
              : [];
            const correctIndexes = Array.isArray(question.correct)
              ? question.correct
              : [question.correct];

            return (
              <View key={question.prompt} style={styles.summaryCard}>
                <Text style={styles.summaryQuestion}>
                  {questionIndex + 1}. {question.prompt}
                </Text>
                <Text
                  style={[
                    styles.resultText,
                    isCorrect ? styles.correctText : styles.incorrectText,
                  ]}
                >
                  {isCorrect ? "Correct" : "Incorrect"}
                </Text>

                <View style={styles.answerList}>
                  {question.choices.map((choice, choiceIndex) => {
                    const wasChosen = chosenIndexes.includes(choiceIndex);
                    const isActualCorrect = correctIndexes.includes(choiceIndex);

                    return (
                      <Text
                        key={`${question.prompt}-${choice}`}
                        style={[
                          styles.answerText,
                          isActualCorrect && styles.correctAnswerText,
                          wasChosen &&
                            !isActualCorrect &&
                            styles.incorrectChosenText,
                        ]}
                      >
                        {choice}
                      </Text>
                    );
                  })}
                </View>

                <Text style={styles.correctAnswerLabel}>
                  Correct answer: {getCorrectChoices(question)}
                </Text>
              </View>
            );
          })}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              navigation.replace("Question", {
                data: QUESTIONS,
                index: 0,
                answers: [],
              })
            }
            style={styles.restartButton}
          >
            <Text style={styles.restartButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Question"
        screenOptions={{
          headerBackVisible: false,
          gestureEnabled: false,
          headerStyle: {
            backgroundColor: "#f6f0e8",
          },
          headerShadowVisible: false,
          headerTintColor: "#3f3429",
          headerTitleStyle: {
            fontWeight: "700",
          },
        }}
      >
        <Stack.Screen
          name="Question"
          component={Question}
          initialParams={{
            data: QUESTIONS,
            index: 0,
            answers: [],
          }}
          options={{ title: "Easy Quiz" }}
        />
        <Stack.Screen
          name="Summary"
          component={Summary}
          options={{ title: "Results" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f4efe8",
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    flex: 1,
    margin: 20,
    padding: 20,
    backgroundColor: "#fffaf4",
    borderRadius: 20,
    shadowColor: "#8f7963",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 3,
  },
  stepText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8a6f55",
    marginBottom: 6,
  },
  typeText: {
    fontSize: 13,
    textTransform: "capitalize",
    color: "#b08968",
    marginBottom: 14,
  },
  questionText: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    color: "#35291f",
    marginBottom: 20,
  },
  choiceGroup: {
    borderRadius: 16,
    borderColor: "#eadbc8",
    overflow: "hidden",
    marginBottom: 24,
  },
  choiceButton: {
    backgroundColor: "#fff",
    minHeight: 58,
  },
  selectedChoiceButton: {
    backgroundColor: "#d6eadf",
  },
  choiceText: {
    color: "#4b3d30",
    fontSize: 16,
  },
  selectedChoiceText: {
    color: "#224733",
    fontWeight: "700",
  },
  nextButton: {
    marginTop: "auto",
    backgroundColor: "#7c9a7f",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  summaryTitle: {
    fontSize: 30,
    fontWeight: "700",
    color: "#35291f",
    marginBottom: 10,
  },
  totalText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#40624d",
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#efe2d2",
  },
  summaryQuestion: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3f3429",
    marginBottom: 8,
  },
  resultText: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
  },
  correctText: {
    color: "#2e7d52",
  },
  incorrectText: {
    color: "#b44c4c",
  },
  answerList: {
    gap: 6,
    marginBottom: 10,
  },
  answerText: {
    fontSize: 15,
    color: "#4f4338",
  },
  correctAnswerText: {
    fontWeight: "700",
  },
  incorrectChosenText: {
    textDecorationLine: "line-through",
    color: "#b44c4c",
  },
  correctAnswerLabel: {
    fontSize: 14,
    color: "#7c6653",
  },
  restartButton: {
    marginTop: 8,
    backgroundColor: "#d9c3a5",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
  },
  restartButtonText: {
    color: "#3a2d21",
    fontSize: 16,
    fontWeight: "700",
  },
});
