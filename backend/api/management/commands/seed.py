"""
Seed the database with realistic sample data for the existing user.
Usage: python manage.py seed
"""
import random
import string
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import (
    Account, Borrower, Course, CustomUser, Deposit, Loan, LoginActivity,
    NationalIDVerification, Payment, PushNotification, Report,
    RepaymentSchedule, ShareTransaction, University,
)


def _tx_ref():
    return "TX-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=10))


class Command(BaseCommand):
    help = "Seed the database with sample data for local development"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user",
            type=str,
            default=None,
            help="Username to seed data for (default: first non-superuser)",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all seeded data before re-seeding",
        )

    def handle(self, *args, **options):
        now = timezone.now()

        # ── Resolve target user ──────────────────────────────────
        username = options["user"]
        if username:
            try:
                user = CustomUser.objects.get(username=username)
            except CustomUser.DoesNotExist:
                self.stderr.write(self.style.ERROR(f"User '{username}' not found."))
                return
        else:
            user = CustomUser.objects.filter(is_superuser=False).first()
            if not user:
                self.stderr.write(self.style.ERROR("No non-superuser found. Create a regular user first."))
                return

        self.stdout.write(f"Seeding data for user: {user.username} (id={user.id})")

        if options["reset"]:
            self._clear(user)

        # ── Universities & Courses ───────────────────────────────
        universities_data = [
            ("Makerere University", "MAK", "Kampala"),
            ("Makerere University Business School", "MUBS", "Kampala"),
            ("Kyambogo University", "KYU", "Kampala"),
            ("Uganda Christian University", "UCU", "Mukono"),
            ("Mbarara University of Science and Technology", "MUST", "Mbarara"),
            ("Gulu University", "GU", "Gulu"),
            ("Busitema University", "BU", "Busia"),
            ("Uganda Martyrs University", "UMU", "Nkozi"),
        ]
        unis = []
        for name, code, loc in universities_data:
            uni, _ = University.objects.get_or_create(
                name=name, defaults={"code": code, "location": loc}
            )
            unis.append(uni)
        self.stdout.write(self.style.SUCCESS(f"  ✓ {len(unis)} universities"))

        courses_data = [
            ("Bachelor of Commerce", "BCOM"),
            ("Bachelor of Business Administration", "BBA"),
            ("Bachelor of Science in Computer Science", "BSCS"),
            ("Bachelor of Information Technology", "BIT"),
            ("Bachelor of Science in Accounting", "BSACC"),
            ("Bachelor of Arts in Economics", "BAECON"),
            ("Bachelor of Laws", "LLB"),
            ("Bachelor of Science in Engineering", "BSE"),
            ("Bachelor of Medicine and Surgery", "MBChB"),
            ("Diploma in Business Studies", "DBS"),
        ]
        courses = []
        for cname, ccode in courses_data:
            course, _ = Course.objects.get_or_create(
                name=cname,
                defaults={
                    "code": ccode,
                    "university": random.choice(unis),
                    "duration_years": random.choice([3, 4, 5]),
                },
            )
            courses.append(course)
        self.stdout.write(self.style.SUCCESS(f"  ✓ {len(courses)} courses"))

        # ── Attach university & course to user if blank ──────────
        if not user.university:
            mubs = University.objects.filter(code="MUBS").first()
            user.university = mubs or unis[0]
        if not user.course:
            bcom = Course.objects.filter(code="BCOM").first()
            user.course = bcom or courses[0]
        if not user.year_of_study:
            user.year_of_study = 3
        if not user.phone_number:
            user.phone_number = "+256700123456"
        if not user.gender:
            user.gender = "Male"
        if not user.date_of_birth:
            user.date_of_birth = "2001-06-15"
        user.is_verified = True
        user.save()

        # ── Accounts ─────────────────────────────────────────────
        acc_savings, _ = Account.objects.get_or_create(
            user=user,
            account_type="Savings",
            defaults={
                "account_number": f"SAV-{user.id:04d}-001",
                "balance": Decimal("1250000.00"),
            },
        )
        acc_shares, _ = Account.objects.get_or_create(
            user=user,
            account_type="Shares",
            defaults={
                "account_number": f"SHR-{user.id:04d}-001",
                "balance": Decimal("500000.00"),
            },
        )
        # Make sure balances aren't zero if they already existed
        if acc_savings.balance == 0:
            acc_savings.balance = Decimal("1250000.00")
            acc_savings.save()
        if acc_shares.balance == 0:
            acc_shares.balance = Decimal("500000.00")
            acc_shares.save()

        self.stdout.write(self.style.SUCCESS(
            f"  ✓ accounts  →  Savings: {acc_savings.balance:,.0f} UGX  |  Shares: {acc_shares.balance:,.0f} UGX"
        ))

        # ── Deposits (last 6 months, realistic amounts) ──────────
        deposit_count = 0
        for months_ago in range(6, 0, -1):
            dt = now - timedelta(days=months_ago * 30)
            # 2-3 deposits per month
            for _ in range(random.randint(2, 3)):
                dt_offset = dt + timedelta(days=random.randint(0, 25), hours=random.randint(8, 18))
                amount = Decimal(random.choice([50000, 100000, 150000, 200000, 250000, 300000]))
                ref = _tx_ref()
                if not Deposit.objects.filter(tx_ref=ref).exists():
                    Deposit.objects.create(
                        user=user,
                        tx_ref=ref,
                        transaction_id=f"RLX-{ref}",
                        amount=amount,
                        status="SUCCESS",
                        created_at=dt_offset,
                    )
                    deposit_count += 1
        self.stdout.write(self.style.SUCCESS(f"  ✓ {deposit_count} deposits"))

        # ── Share Transactions (purchases + dividends) ───────────
        share_tx_count = 0
        for months_ago in [5, 3, 1]:
            dt = now - timedelta(days=months_ago * 30)
            shares = random.randint(5, 20)
            ShareTransaction.objects.create(
                user=user,
                number_of_shares=shares,
                amount=Decimal(shares * 10000),
                transaction_type="PURCHASE",
                status="COMPLETED",
                timestamp=dt,
            )
            share_tx_count += 1

        # Dividends for current year
        for q in [1, 2]:
            div_date = now.replace(month=q * 3, day=28) if now.month >= q * 3 else now - timedelta(days=90 * (3 - q))
            ShareTransaction.objects.create(
                user=user,
                number_of_shares=0,
                amount=Decimal(random.choice([75000, 90000, 120000, 150000])),
                transaction_type="DIVIDEND",
                status="COMPLETED",
                timestamp=div_date,
            )
            share_tx_count += 1
        self.stdout.write(self.style.SUCCESS(f"  ✓ {share_tx_count} share transactions (incl. dividends)"))

        # ── Borrower + Loans ─────────────────────────────────────
        borrower, _ = Borrower.objects.get_or_create(
            user=user,
            defaults={"address": "Plot 12, Wandegeya, Kampala"},
        )

        # Active loan
        loan1, created1 = Loan.objects.get_or_create(
            loan_code="LN-0001",
            defaults={
                "borrower": borrower,
                "amount": Decimal("2000000.00"),
                "interest_rate": Decimal("12.00"),
                "start_date": now - timedelta(days=90),
                "due_date": now + timedelta(days=270),
                "loan_status": "DISBURSED",
            },
        )
        # Completed loan
        loan2, created2 = Loan.objects.get_or_create(
            loan_code="LN-0002",
            defaults={
                "borrower": borrower,
                "amount": Decimal("500000.00"),
                "interest_rate": Decimal("10.00"),
                "start_date": now - timedelta(days=365),
                "due_date": now - timedelta(days=90),
                "loan_status": "COMPLETED",
            },
        )
        self.stdout.write(self.style.SUCCESS(f"  ✓ borrower profile + 2 loans"))

        # ── Repayment Schedules ──────────────────────────────────
        if created1:
            for i in range(1, 13):
                due = (now - timedelta(days=90) + timedelta(days=30 * i)).date()
                paid = due < now.date()
                RepaymentSchedule.objects.create(
                    loan=loan1,
                    installment_number=i,
                    due_date=due,
                    amount=Decimal("186667.00"),
                    status="PAID" if paid else "PENDING",
                )
        self.stdout.write(self.style.SUCCESS(f"  ✓ repayment schedules"))

        # ── Payments (for the active loan, simulate 3 paid) ──────
        payment_count = 0
        if created1:
            for i in range(1, 4):
                Payment.objects.create(
                    borrower=borrower,
                    loan=loan1,
                    amount=Decimal("186667.00"),
                    payment_status="COMPLETED",
                )
                payment_count += 1
        # Payment for completed loan
        if created2:
            Payment.objects.create(
                borrower=borrower,
                loan=loan2,
                amount=Decimal("550000.00"),
                payment_status="COMPLETED",
            )
            payment_count += 1
        self.stdout.write(self.style.SUCCESS(f"  ✓ {payment_count} payments"))

        # ── Login Activities ─────────────────────────────────────
        devices = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605",
            "Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile",
        ]
        locations = ["Kampala, UG", "Mukono, UG", "Entebbe, UG"]
        login_count = 0
        for days_ago in range(30, 0, -1):
            if random.random() < 0.6:  # ~60% chance of login on any day
                dt = now - timedelta(days=days_ago, hours=random.randint(6, 22))
                LoginActivity.objects.create(
                    user=user,
                    ip_address=f"192.168.1.{random.randint(2, 254)}",
                    location=random.choice(locations),
                    device=random.choice(devices),
                    login_time=dt,
                )
                login_count += 1
        self.stdout.write(self.style.SUCCESS(f"  ✓ {login_count} login activities"))

        # ── Report ───────────────────────────────────────────────
        Report.objects.get_or_create(
            borrower=borrower,
            defaults={
                "total_loans": Decimal("2500000.00"),
                "total_payments": Decimal("1110001.00"),
            },
        )
        self.stdout.write(self.style.SUCCESS(f"  ✓ report"))

        # ── Summary ──────────────────────────────────────────────
        total_deposits = Deposit.objects.filter(user=user, status="SUCCESS").count()
        total_savings = Account.objects.filter(user=user).values_list("balance", flat=True)
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("═" * 50))
        self.stdout.write(self.style.SUCCESS(f"  Seed complete for '{user.username}'"))
        self.stdout.write(self.style.SUCCESS(f"  Savings balance: {acc_savings.balance:,.0f} UGX"))
        self.stdout.write(self.style.SUCCESS(f"  Shares balance:  {acc_shares.balance:,.0f} UGX"))
        self.stdout.write(self.style.SUCCESS(f"  Deposits:        {total_deposits}"))
        self.stdout.write(self.style.SUCCESS(f"  Active loan:     {loan1.amount:,.0f} UGX ({loan1.loan_status})"))
        self.stdout.write(self.style.SUCCESS("═" * 50))

    def _clear(self, user):
        """Remove all seeded data for a user (keeps the user itself)."""
        self.stdout.write("  Clearing existing data...")
        Deposit.objects.filter(user=user).delete()
        ShareTransaction.objects.filter(user=user).delete()
        Account.objects.filter(user=user).delete()
        LoginActivity.objects.filter(user=user).delete()
        PushNotification.objects.filter(user=user).delete()
        try:
            b = user.borrower_profile
            Payment.objects.filter(borrower=b).delete()
            for loan in Loan.objects.filter(borrower=b):
                RepaymentSchedule.objects.filter(loan=loan).delete()
            Loan.objects.filter(borrower=b).delete()
            Report.objects.filter(borrower=b).delete()
            b.delete()
        except Borrower.DoesNotExist:
            pass
        self.stdout.write(self.style.SUCCESS("  ✓ cleared"))
