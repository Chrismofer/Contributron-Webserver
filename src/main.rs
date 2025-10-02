use {
    chrono::{DateTime, Datelike, Days, NaiveDate, NaiveTime, Utc},
    image::{GenericImageView, Pixel},
    std::{
        fs,
        io::ErrorKind,
        iter,
        ops::RangeInclusive,
        path::{self, PathBuf},
    },
};

const DAYS: u16 = const { 7 * 53 };

#[derive(Debug, clap::Parser)]
#[command(version, about, long_about = None)]
struct Args {
    /// Path (to be created) to hold the fake Git repository
    #[arg(short, long)]
    repo: PathBuf,
    /// Path to the image to draw (required to be grayscale and 7 pixels tall)
    #[arg(short, long)]
    image: PathBuf,
    /// Name of the Git contributor (e.g. your name).
    #[arg(short, long)]
    name: String,
    /// Email of the Git contributor (e.g. your email).
    #[arg(short, long)]
    email: String,
    /// Git reference (usually a branch name).
    #[arg(short, long, default_value = "HEAD")]
    git_reference: String,
    /// Maximum number of commits per day.
    #[arg(short, long, default_value_t = 255)]
    brightness_levels: usize,
    /// Whether to overwrite an existing folder if one exists.
    #[arg(short, long, default_value_t = false)]
    overwrite: bool,
}

struct GitInfo<'reference, 'name, 'email> {
    repo: git2::Repository,
    reference: &'reference str,
    name: &'name str,
    email: &'email str,
}

#[inline]
fn draw_repeating_pattern(
    git: &GitInfo,
    columns: &[[u8; 7]],
    dates: RangeInclusive<NaiveDate>,
    brightness_levels: u16,
) {
    // TODO: dithering?

    let mut pixels = iter::repeat_with(move || columns.iter().chain(iter::once(&[0; 7])))
        .flatten()
        .flatten()
        .copied();

    let (start_date, end_date) = dates.into_inner();
    let mut date = start_date;
    while date <= end_date {
        let pixel = pixels
            .next()
            .expect("Internal error: ran out of pixels (should repeat endlessly)");

        let () = draw_pixel(git, pixel, date, brightness_levels);

        println!(
            "{:3}% ({date})",
            date.signed_duration_since(start_date).num_days() * 100 / i64::from(DAYS),
        );

        date = match date.checked_add_days(Days::new(1)) {
            Some(some) => some,
            None => panic!("Internal error: couldn't subtract 1 day from {date}"),
        };
    }
}

#[inline]
fn draw_pixel(git: &GitInfo, pixel: u8, date: NaiveDate, brightness_levels: u16) {
    let utc = {
        let time = {
            let hour = 12;
            let min = 0;
            let sec = 0;
            match NaiveTime::from_hms_opt(hour, min, sec) {
                Some(some) => some,
                None => panic!("Internal error: H:M:S {hour}:{min}:{sec}"),
            }
        };
        date.and_time(time).and_utc()
    };

    let sig = {
        let time = {
            let seconds_since_epoch: i64 = {
                utc.signed_duration_since(DateTime::UNIX_EPOCH)
                    .num_seconds()
            };
            git2::Time::new(seconds_since_epoch, 0)
        };
        match git2::Signature::new(git.name, git.email, &time) {
            Ok(ok) => ok,
            Err(e) => panic!(
                "Internal error: couldn't create a Git signature from name `{}`, email `{}`, and time {time:?}: {e}",
                git.name, git.email,
            ),
        }
    };

    let tree = {
        let tree_id = {
            let mut index = match git.repo.index() {
                Ok(ok) => ok,
                Err(e) => panic!("Internal error while fetching the repo's index: {e}"),
            };
            // ... index.add_path(..) ...
            match index.write_tree() {
                Ok(ok) => ok,
                Err(e) => panic!("Internal error while writing the repo's tree: {e}"),
            }
        };
        match git.repo.find_tree(tree_id) {
            Ok(ok) => ok,
            Err(e) => panic!("Internal error while finding the repo's tree: {e}"),
        }
    };

    let mut parent = {
        let reference = match git.repo.find_reference(git.reference) {
            Ok(ok) => ok,
            Err(e) => panic!("Couldn't find Git reference `{}`: {e}", git.reference),
        };
        reference.peel_to_commit().ok()
    };

    let n_commits = {
        let extra_space = pixel as u16;
        let product = extra_space * brightness_levels;
        (product >> 8) as u8
    };
    for i in 0..n_commits {
        // let message = format!("{} #{}/{pixel}", utc.to_rfc3339(), i + 1);
        let message = format!("#{}/{pixel}", i + 1);
        let parents: &[&_] = if let Some(ref parent) = parent {
            &[parent]
        } else {
            &[]
        };
        let oid = match git
            .repo
            .commit(Some(git.reference), &sig, &sig, &message, &tree, parents)
        {
            Ok(ok) => ok,
            Err(e) => panic!(
                "Couldn't commit to reference `{}` with author & committer `{sig}` and message `{message}` to tree {tree:?} with parents {parents:?}: {e}",
                git.reference,
            ),
        };
        parent = Some(match git.repo.find_commit(oid) {
            Ok(ok) => ok,
            Err(e) => {
                panic!("Internal error: couldn't find the commit we just made (OID {oid}): {e}")
            }
        });
    }
}

fn main() {
    let Args {
        repo,
        image,
        ref name,
        ref email,
        ref git_reference,
        brightness_levels,
        overwrite,
    } = clap::Parser::parse();

    let brightness_levels = match brightness_levels {
        0 => panic!("The number of brightness levels should be nonzero: nothing would be drawn."),
        #[expect(clippy::as_conversions, reason = "Range explicitly checked.")]
        1..=256 => brightness_levels as u16,
        _ => panic!("The number of brightness levels should be at most 256."),
    };

    // Convert the repository path to an absolute path:
    let repo = match path::absolute(&repo) {
        Ok(ok) => ok,
        Err(e) => panic!("Couldn't make `{}` absolute: {e}", repo.to_string_lossy()),
    };

    // Create the folders nesting the repo folder, if any,
    // before the repo itself to avoid a race condition:
    if let Some(parent) = repo.parent() {
        match fs::create_dir_all(parent) {
            Ok(()) => {}
            Err(e) => panic!(
                "Couldn't ensure that `{}` exists: {e}",
                parent.to_string_lossy(),
            ),
        }
    }

    if overwrite {
        match fs::remove_dir_all(&repo) {
            Ok(()) => {}
            Err(e) => assert_eq!(
                e.kind(),
                ErrorKind::NotFound,
                "Couldn't remove `{}`: {e} ({e:#?})",
                repo.to_string_lossy(),
            ),
        }
    }

    // Try to create the repo folder, exiting on failure,
    // instead of checking its existence and then trying
    // (to avoid a race condition between those steps):
    match fs::create_dir(&repo) {
        Ok(()) => {}
        Err(e) => panic!("Couldn't create `{}`: {e}", repo.to_string_lossy()),
    }

    let repo = match git2::Repository::init(&repo) {
        Ok(ok) => ok,
        Err(e) => panic!(
            "Couldn't initialize a Git repository in `{}`: {e}",
            repo.to_string_lossy(),
        ),
    };

    let now = Utc::now();
    let date = {
        let exact = now.date_naive();
        let days_since_sunday = exact.weekday().num_days_from_sunday();
        match exact.checked_sub_days(Days::new(days_since_sunday.into())) {
            Some(some) => some,
            None => panic!("Couldn't subtract {days_since_sunday} days from {exact}"),
        }
    };
    let a_year_ago = {
        let a_year = Days::new(u64::from(DAYS)); // Rounded up to the nearest week.
        match date.checked_sub_days(a_year) {
            Some(some) => some,
            None => panic!("Couldn't subtract {a_year:?} from {date}"),
        }
    };

    let metadata = match image::open(&image) {
        Ok(ok) => ok,
        Err(e) => panic!(
            "Couldn't open `{}` as an image: {e}",
            image.to_string_lossy(),
        ),
    };
    let (width, height) = metadata.dimensions();
    assert_eq!(
        height,
        7,
        "Expected `{}` to be seven pixels tall (?x7), but it was {width}x{height}",
        image.to_string_lossy(),
    );
    let color = metadata.color();
    assert!(
        !color.has_color(),
        "Expected `{}` to be grayscale, but it was {color:?}",
        image.to_string_lossy(),
    );

    let columns: Vec<[u8; 7]> = (0..width)
        .map(|x| {
            core::array::from_fn(|y| {
                let y = match u32::try_from(y) {
                    Ok(ok) => ok,
                    Err(e) => panic!("Ridiculously wide image: y-index was {y}: {e}"),
                };
                let [luma] = metadata.get_pixel(x, y).to_luma().0;
                luma
            })
        })
        .collect();

    let git = GitInfo {
        repo,
        reference: git_reference,
        name,
        email,
    };
    let () = draw_repeating_pattern(&git, &columns, a_year_ago..=date, brightness_levels);
}