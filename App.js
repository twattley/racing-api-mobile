// Main App Entry Point
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens
import TodaysRacesScreen from './src/screens/TodaysRacesScreen';
import RaceDetailsScreen from './src/screens/RaceDetailsScreen';
import LiveBettingScreen from './src/screens/LiveBettingScreen';
import BettingResultsScreen from './src/screens/BettingResultsScreen';
import FeedbackRacesScreen from './src/screens/FeedbackRacesScreen';
import FeedbackRaceDetailsScreen from './src/screens/FeedbackRaceDetailsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 60000,
    },
  },
});

const Tab = createBottomTabNavigator();
const TodayStack = createNativeStackNavigator();
const BettingStack = createNativeStackNavigator();
const FeedbackStack = createNativeStackNavigator();

function TodayStackScreen() {
  return (
    <TodayStack.Navigator>
      <TodayStack.Screen
        name="TodaysRaces"
        component={TodaysRacesScreen}
        options={{ title: "Today's Races" }}
      />
      <TodayStack.Screen
        name="RaceDetails"
        component={RaceDetailsScreen}
        options={{ title: 'Race Details' }}
      />
    </TodayStack.Navigator>
  );
}

function BettingStackScreen() {
  return (
    <BettingStack.Navigator>
      <BettingStack.Screen
        name="LiveBetting"
        component={LiveBettingScreen}
        options={{ title: 'Live Bets' }}
      />
      <BettingStack.Screen
        name="BettingResults"
        component={BettingResultsScreen}
        options={{ title: 'Results' }}
      />
    </BettingStack.Navigator>
  );
}

function FeedbackStackScreen() {
  return (
    <FeedbackStack.Navigator>
      <FeedbackStack.Screen
        name="FeedbackRaces"
        component={FeedbackRacesScreen}
        options={{ title: 'Feedback' }}
      />
      <FeedbackStack.Screen
        name="FeedbackRaceDetails"
        component={FeedbackRaceDetailsScreen}
        options={{ title: 'Race Review' }}
      />
    </FeedbackStack.Navigator>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName;
                if (route.name === 'Today') {
                  iconName = focused ? 'today' : 'today-outline';
                } else if (route.name === 'Feedback') {
                  iconName = focused ? 'analytics' : 'analytics-outline';
                } else if (route.name === 'Betting') {
                  iconName = focused ? 'cash' : 'cash-outline';
                } else if (route.name === 'Settings') {
                  iconName = focused ? 'settings' : 'settings-outline';
                }
                return <Ionicons name={iconName} size={size} color={color} />;
              },
              tabBarActiveTintColor: '#2563eb',
              tabBarInactiveTintColor: 'gray',
              headerShown: false,
            })}
          >
            <Tab.Screen name="Today" component={TodayStackScreen} />
            <Tab.Screen name="Feedback" component={FeedbackStackScreen} />
            <Tab.Screen name="Betting" component={BettingStackScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
