import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

/**
 * Tiffin Subscription Management System
 * ---------------------------------------
 * A simple console-based Java application to manage tiffin (meal) subscriptions.
 *
 * Features:
 *  1. Add a new customer
 *  2. View all customers
 *  3. Subscribe a customer to a tiffin plan
 *  4. Cancel a customer's subscription
 *  5. Calculate and display total bill
 *  6. Exit
 */
public class TiffinSubscription {

    // ---------- Plan class ----------
    static class Plan {
        String name;
        int mealsPerDay;
        double pricePerMeal;

        Plan(String name, int mealsPerDay, double pricePerMeal) {
            this.name = name;
            this.mealsPerDay = mealsPerDay;
            this.pricePerMeal = pricePerMeal;
        }

        double monthlyCost(int days) {
            return mealsPerDay * pricePerMeal * days;
        }
    }

    // ---------- Customer class ----------
    static class Customer {
        int id;
        String name;
        String phone;
        Plan subscribedPlan;
        int subscriptionDays; // number of days subscribed in the month
        boolean isActive;

        Customer(int id, String name, String phone) {
            this.id = id;
            this.name = name;
            this.phone = phone;
            this.subscribedPlan = null;
            this.subscriptionDays = 0;
            this.isActive = false;
        }

        void showDetails() {
            System.out.println("----------------------------------");
            System.out.println("ID          : " + id);
            System.out.println("Name        : " + name);
            System.out.println("Phone       : " + phone);
            if (isActive && subscribedPlan != null) {
                System.out.println("Plan        : " + subscribedPlan.name);
                System.out.println("Meals/Day   : " + subscribedPlan.mealsPerDay);
                System.out.println("Days        : " + subscriptionDays);
                System.out.println("Status      : ACTIVE");
                System.out.printf("Total Bill  : Rs. %.2f%n", subscribedPlan.monthlyCost(subscriptionDays));
            } else {
                System.out.println("Status      : NOT SUBSCRIBED");
            }
            System.out.println("----------------------------------");
        }
    }

    // ---------- Main application data ----------
    static List<Customer> customers = new ArrayList<>();
    static List<Plan> plans = new ArrayList<>();
    static int nextCustomerId = 1;
    static Scanner sc = new Scanner(System.in);

    public static void main(String[] args) {
        setupPlans();
        int choice;

        do {
            printMenu();
            choice = readInt("Enter your choice: ");

            switch (choice) {
                case 1:
                    addCustomer();
                    break;
                case 2:
                    viewAllCustomers();
                    break;
                case 3:
                    subscribeCustomer();
                    break;
                case 4:
                    cancelSubscription();
                    break;
                case 5:
                    calculateBill();
                    break;
                case 6:
                    System.out.println("Thank you for using Tiffin Subscription System!");
                    break;
                default:
                    System.out.println("Invalid choice. Please try again.");
            }
        } while (choice != 6);

        sc.close();
    }

    // ---------- Setup default tiffin plans ----------
    static void setupPlans() {
        plans.add(new Plan("Basic (1 meal/day)", 1, 60.0));
        plans.add(new Plan("Standard (2 meals/day)", 2, 55.0));
        plans.add(new Plan("Premium (3 meals/day)", 3, 50.0));
    }

    static void printMenu() {
        System.out.println("\n===== TIFFIN SUBSCRIPTION MANAGEMENT SYSTEM =====");
        System.out.println("1. Add New Customer");
        System.out.println("2. View All Customers");
        System.out.println("3. Subscribe to a Tiffin Plan");
        System.out.println("4. Cancel Subscription");
        System.out.println("5. Calculate Bill");
        System.out.println("6. Exit");
    }

    // ---------- Add a new customer ----------
    static void addCustomer() {
        System.out.print("Enter customer name: ");
        String name = sc.nextLine();
        System.out.print("Enter phone number: ");
        String phone = sc.nextLine();

        Customer customer = new Customer(nextCustomerId++, name, phone);
        customers.add(customer);
        System.out.println("Customer added successfully! Customer ID: " + customer.id);
    }

    // ---------- View all customers ----------
    static void viewAllCustomers() {
        if (customers.isEmpty()) {
            System.out.println("No customers found.");
            return;
        }
        for (Customer c : customers) {
            c.showDetails();
        }
    }

    // ---------- Subscribe a customer to a plan ----------
    static void subscribeCustomer() {
        Customer customer = findCustomerById();
        if (customer == null) return;

        System.out.println("\nAvailable Plans:");
        for (int i = 0; i < plans.size(); i++) {
            Plan p = plans.get(i);
            System.out.printf("%d. %s - Rs.%.2f per meal%n", i + 1, p.name, p.pricePerMeal);
        }

        int planChoice = readInt("Choose a plan (1-" + plans.size() + "): ");
        if (planChoice < 1 || planChoice > plans.size()) {
            System.out.println("Invalid plan selection.");
            return;
        }

        int days = readInt("Enter number of subscription days: ");
        if (days <= 0) {
            System.out.println("Days must be greater than zero.");
            return;
        }

        customer.subscribedPlan = plans.get(planChoice - 1);
        customer.subscriptionDays = days;
        customer.isActive = true;

        System.out.println("Subscription successful for " + customer.name + "!");
    }

    // ---------- Cancel a customer's subscription ----------
    static void cancelSubscription() {
        Customer customer = findCustomerById();
        if (customer == null) return;

        if (!customer.isActive) {
            System.out.println(customer.name + " does not have an active subscription.");
            return;
        }

        customer.isActive = false;
        customer.subscribedPlan = null;
        customer.subscriptionDays = 0;
        System.out.println("Subscription cancelled for " + customer.name + ".");
    }

    // ---------- Calculate bill for a customer ----------
    static void calculateBill() {
        Customer customer = findCustomerById();
        if (customer == null) return;

        if (!customer.isActive || customer.subscribedPlan == null) {
            System.out.println(customer.name + " has no active subscription.");
            return;
        }

        double bill = customer.subscribedPlan.monthlyCost(customer.subscriptionDays);
        System.out.printf("Total bill for %s: Rs. %.2f%n", customer.name, bill);
    }

    // ---------- Helper: find a customer by ID ----------
    static Customer findCustomerById() {
        int id = readInt("Enter customer ID: ");
        for (Customer c : customers) {
            if (c.id == id) return c;
        }
        System.out.println("Customer not found.");
        return null;
    }

    // ---------- Helper: safely read an integer ----------
    static int readInt(String prompt) {
        System.out.print(prompt);
        while (!sc.hasNextInt()) {
            System.out.print("Please enter a valid number: ");
            sc.next();
        }
        int value = sc.nextInt();
        sc.nextLine(); // consume newline
        return value;
    }
}